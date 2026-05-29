import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requirePermission } from '../middleware/auth.js';

/**
 * Admin router — every route is gated on `roles.manage`, a permission
 * held ONLY by super_admin (see seed migration). This is the surface
 * that makes the super_admin role functional: listing users and
 * (re)assigning their role. Uses supabaseAdmin (service role) which
 * bypasses RLS; the requirePermission gate is the authorization.
 */
export const adminRouter = Router();

adminRouter.use(requirePermission('roles.manage'));

// GET /api/admin/roles — available roles for the selector.
adminRouter.get('/roles', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('id, name, description')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/users — auth users joined with their assigned role names.
adminRouter.get('/users', async (_req, res) => {
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) return res.status(500).json({ error: authErr.message });

  const { data: rows, error: rolesErr } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, roles(name)');
  if (rolesErr) return res.status(500).json({ error: rolesErr.message });

  const rolesByUser = new Map<string, string[]>();
  for (const r of rows ?? []) {
    const name = (r as any).roles?.name;
    if (!name) continue;
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(name);
    rolesByUser.set(r.user_id, list);
  }

  res.json(
    authData.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      roles: rolesByUser.get(u.id) ?? [],
    })),
  );
});

// PUT /api/admin/users/:id/role — authoritatively set a user's single role.
adminRouter.put('/users/:id/role', async (req, res) => {
  const { role } = req.body as { role?: string };
  const userId = req.params.id;
  if (!role) return res.status(400).json({ error: 'role is required' });

  // Prevent self-lockout: a super_admin cannot demote themselves (which
  // would strip roles.manage and leave them unable to undo it).
  if (userId === req.user!.id && role !== 'super_admin') {
    return res.status(400).json({ error: 'You cannot change your own super_admin role.' });
  }

  const { data: roleRow, error: roleErr } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', role)
    .maybeSingle();
  if (roleErr) return res.status(500).json({ error: roleErr.message });
  if (!roleRow) return res.status(400).json({ error: `Unknown role: ${role}` });

  // Authoritative: clear existing roles, then assign the single target.
  const del = await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  if (del.error) return res.status(500).json({ error: del.error.message });

  const ins = await supabaseAdmin
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleRow.id, created_by: req.user!.id });
  if (ins.error) return res.status(500).json({ error: ins.error.message });

  res.json({ userId, role });
});
