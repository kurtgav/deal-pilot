import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useRBAC } from '../../hooks/useRBAC';
import { toast } from '../../components/Toaster';

type AdminUser = { id: string; email: string | null; createdAt: string; roles: string[] };
type RoleRow = { id: string; name: string; description: string };

const roleBadge: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700 border border-purple-100',
  admin: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  manager: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  user: 'bg-slate-100 text-slate-600',
};

export default function Admin() {
  const { userId } = useRBAC();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getAdminUsers(), api.getAdminRoles()])
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .catch((e) => toast(e.message || 'Failed to load admin data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(u: AdminUser, role: string) {
    if (role === (u.roles[0] ?? '')) return;
    setSavingId(u.id);
    try {
      await api.setUserRole(u.id, role);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, roles: [role] } : x)));
      toast(`Updated ${u.email ?? 'user'} → ${role}`, 'info');
    } catch (e: any) {
      toast(e.message || 'Failed to update role', 'error');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="dash-card">
        <div className="px-6 py-4 border-b border-[#f0f0f0]">
          <h2 className="text-[14px] font-semibold text-slate-900">Users &amp; Roles</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Assign roles to users. Changes take effect when the user&apos;s session refreshes.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Current Role</th>
                <th className="px-6 py-3">Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const current = u.roles[0] ?? 'user';
                const isSelf = u.id === userId;
                return (
                  <tr key={u.id} className="border-t border-[#f5f5f5]">
                    <td className="px-6 py-3.5 text-[14px] text-slate-900">
                      {u.email ?? '—'}
                      {isSelf && <span className="ml-2 text-[11px] text-slate-400">(you)</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge[current] || 'bg-slate-100 text-slate-600'}`}>
                        {current}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <select
                        value={current}
                        disabled={savingId === u.id || (isSelf && current === 'super_admin')}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-[13px] text-slate-800 bg-white outline-none focus:border-indigo-300 disabled:opacity-50"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {loading && (
                <tr><td colSpan={3} className="px-6 py-16 text-center text-[14px] text-slate-400">Loading users…</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-16 text-center text-[14px] text-slate-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
