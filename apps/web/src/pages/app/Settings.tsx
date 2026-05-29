import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRBAC } from '../../hooks/useRBAC';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, permissions, isSuperAdmin } = useRBAC();

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Profile */}
      <div className="dash-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-900">Account</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Your DealPilot account details and access.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-[13px] text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#f0f0f0]">
          <div>
            <dt className="text-[12px] text-slate-400">Email</dt>
            <dd className="mt-1 text-[13px] text-slate-800 truncate">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-slate-400">User ID</dt>
            <dd className="mt-1 text-[12px] text-slate-600 font-mono truncate">
              {user?.id ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-slate-400">Created</dt>
            <dd className="mt-1 text-[13px] text-slate-800">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </dd>
          </div>
        </dl>

        <div className="pt-2 border-t border-[#f0f0f0]">
          <div className="text-[12px] text-slate-400 mb-2">Roles</div>
          <div className="flex flex-wrap gap-1.5">
            {roles.length === 0 ? (
              <span className="text-[13px] text-slate-500">No roles assigned</span>
            ) : (
              roles.map((r) => (
                <span
                  key={r}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    r === 'super_admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-100'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {r}
                </span>
              ))
            )}
            {isSuperAdmin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                full access
              </span>
            )}
          </div>
        </div>

        {permissions.length > 0 && (
          <details className="pt-2 border-t border-[#f0f0f0] group">
            <summary className="cursor-pointer text-[12px] text-slate-500 hover:text-slate-700 select-none">
              View permissions ({permissions.length})
            </summary>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {permissions.map((p) => (
                <code
                  key={p}
                  className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded truncate"
                >
                  {p}
                </code>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Voice Agent */}
        <div className="dash-card p-6 space-y-4">
          <h2 className="text-[14px] font-semibold text-slate-900">Voice Agent</h2>
          <div className="space-y-3">
            <label className="block">
              <span className="text-[13px] text-slate-500">Agent Name</span>
              <input
                defaultValue="DealPilot AI"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-[13px] text-slate-500">Voice Style</span>
              <select className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 bg-white">
                <option>Professional</option>
                <option>Conversational</option>
                <option>Technical</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[13px] text-slate-500">Max Call Duration</span>
              <input
                type="number"
                defaultValue={15}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300"
              />
              <span className="text-[12px] text-slate-400">minutes</span>
            </label>
          </div>
        </div>

        {/* Handoff Defaults */}
        <div className="dash-card p-6 space-y-4">
          <h2 className="text-[14px] font-semibold text-slate-900">Handoff Defaults</h2>
          <div className="space-y-3">
            <label className="block">
              <span className="text-[13px] text-slate-500">Default Assignee</span>
              <input
                defaultValue="Sales Team"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-[13px] text-slate-500">Qualification Threshold</span>
              <input
                type="number"
                defaultValue={70}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300"
              />
              <span className="text-[12px] text-slate-400">score out of 100</span>
            </label>
            <label className="block">
              <span className="text-[13px] text-slate-500">Auto-generate Summary</span>
              <select className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 bg-white">
                <option>Always</option>
                <option>Only for qualified leads</option>
                <option>Never</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
