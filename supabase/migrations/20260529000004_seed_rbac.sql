-- =====================================================================
-- RBAC Seed Data
-- ---------------------------------------------------------------------
-- Idempotent (ON CONFLICT DO NOTHING) — safe to re-run after schema
-- changes or to recover from a partial seed. Each role-permission
-- mapping uses set logic against permission NAMES (not IDs), so adding
-- a new permission to a role is just a matter of editing the IN list.
-- =====================================================================

-- ROLES
insert into public.roles (name, description) values
  ('super_admin', 'Full system access; can manage roles and bypass restrictions'),
  ('admin',       'Administrative access; can manage users and most resources'),
  ('manager',     'Team management; can manage own team''s resources'),
  ('user',        'Standard authenticated user with basic access')
on conflict (name) do nothing;

-- PERMISSIONS (resource.action convention)
insert into public.permissions (name, description) values
  -- documents
  ('documents.read',       'View own documents'),
  ('documents.read_any',   'View any user''s documents'),
  ('documents.create',     'Create new documents'),
  ('documents.update',     'Update own documents'),
  ('documents.update_any', 'Update any user''s documents'),
  ('documents.delete',     'Delete own documents'),
  ('documents.delete_any', 'Delete any user''s documents'),
  -- users
  ('users.read',           'View user list and profiles'),
  ('users.create',         'Invite/create new users'),
  ('users.update',         'Update user profiles'),
  ('users.delete',         'Delete users'),
  -- roles
  ('roles.read',           'View roles and permissions'),
  ('roles.manage',         'Create/update/delete roles and assign permissions'),
  -- billing
  ('billing.read',         'View billing information'),
  ('billing.manage',       'Manage billing, subscriptions, and payment methods')
on conflict (name) do nothing;

-- =====================================================================
-- ROLE-PERMISSION MAPPINGS
-- ---------------------------------------------------------------------
-- Pattern: cross join roles × permissions filtered by name. This means
-- if you add a permission to the IN list, the seed grants it on next
-- run without manual UUID lookup.
-- =====================================================================

-- super_admin → ALL permissions (the cross join with no filter on p)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  cross join public.permissions p
  where r.name = 'super_admin'
on conflict do nothing;

-- admin → everything EXCEPT roles.manage (only super_admin manages roles
-- to prevent privilege escalation: an admin shouldn't be able to grant
-- themselves super_admin).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  cross join public.permissions p
  where r.name = 'admin'
    and p.name in (
      'documents.read', 'documents.read_any', 'documents.create',
      'documents.update', 'documents.update_any',
      'documents.delete', 'documents.delete_any',
      'users.read', 'users.create', 'users.update', 'users.delete',
      'roles.read',
      'billing.read', 'billing.manage'
    )
on conflict do nothing;

-- manager → team-level operations (read across, write only own)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  cross join public.permissions p
  where r.name = 'manager'
    and p.name in (
      'documents.read', 'documents.read_any', 'documents.create',
      'documents.update', 'documents.delete',
      'users.read', 'roles.read', 'billing.read'
    )
on conflict do nothing;

-- user → basic self-service only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  cross join public.permissions p
  where r.name = 'user'
    and p.name in (
      'documents.read',
      'documents.create',
      'documents.update',
      'documents.delete'
    )
on conflict do nothing;

-- =====================================================================
-- SUPER ADMIN BOOTSTRAP
-- ---------------------------------------------------------------------
-- HOW TO BOOTSTRAP YOUR FIRST SUPER ADMIN:
--   1. Sign up your first user via Supabase Auth (dashboard or app)
--   2. In Supabase dashboard, go to Authentication → Users
--   3. Copy that user's UUID
--   4. Replace the placeholder UUID below with the real UUID
--   5. Run: supabase db push   (or re-run the seed manually)
--   6. The user signs out and back in to receive the new JWT claims
--
-- WHY this approach:
--   • No runtime endpoints (no attack surface for "first user wins")
--   • No env-var-driven privilege escalation (can't be tampered at runtime)
--   • Auditable in version control (git log shows who became admin and when)
--   • Safe for production (the placeholder UUID is intentionally invalid
--     so re-running the seed never grants admin to a phantom row)
-- =====================================================================
do $$
declare
  bootstrap_uuid      uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE ME
  super_admin_role_id uuid;
begin
  -- Skip if placeholder is unchanged (avoids creating phantom row).
  if bootstrap_uuid = '00000000-0000-0000-0000-000000000000' then
    raise notice 'Super admin bootstrap UUID is still the placeholder; skipping. Edit 20260529000004_seed_rbac.sql to grant super_admin.';
    return;
  end if;

  -- Verify the user actually exists in auth.users to avoid orphaned rows.
  if not exists (select 1 from auth.users where id = bootstrap_uuid) then
    raise warning 'Bootstrap user % not found in auth.users; skipping super_admin assignment.', bootstrap_uuid;
    return;
  end if;

  select id into super_admin_role_id from public.roles where name = 'super_admin';

  insert into public.user_roles (user_id, role_id)
    values (bootstrap_uuid, super_admin_role_id)
    on conflict do nothing;

  raise notice 'Super admin role granted to %', bootstrap_uuid;
end
$$;
