import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ArrowUpDown, Database, Settings, Shield,
  Plus, Menu, X, LogOut, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRBAC } from '../../hooks/useRBAC';

const nav = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/leads', icon: Users, label: 'Leads' },
  { to: '/app/handoffs', icon: ArrowUpDown, label: 'Handoffs' },
  { to: '/app/knowledge', icon: Database, label: 'Knowledge Base' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

const titles: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/leads': 'Leads',
  '/app/handoffs': 'Handoffs',
  '/app/knowledge': 'Knowledge Base',
  '/app/settings': 'Settings',
  '/app/admin': 'Admin',
};

function emailToInitial(email: string | null | undefined): string {
  if (!email) return 'U';
  return email.charAt(0).toUpperCase();
}

function emailToDisplayName(email: string | null | undefined): string {
  if (!email) return 'User';
  // Strip the domain for compactness in the sidebar.
  const local = email.split('@')[0];
  return local.length > 18 ? local.slice(0, 16) + '…' : local;
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { roles, hasPermission } = useRBAC();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const title = titles[pathname] || (pathname.startsWith('/app/leads/') ? 'Lead Detail' : 'Dashboard');

  // Close the account menu when clicking outside.
  useEffect(() => {
    if (!accountOpen) return;
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  async function handleSignOut() {
    setAccountOpen(false);
    try {
      await signOut();
    } finally {
      // Always navigate, even if sign-out errored — client state is cleared
      // and the user expects to return to the landing.
      navigate('/', { replace: true });
    }
  }

  // Show the highest role for compactness; fall back to "Member".
  const primaryRole = roles[0] ?? 'member';

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside
        className={`dash-sidebar fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-14 shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white">DP</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">DealPilot</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
          {hasPermission('roles.manage') && (
            <NavLink
              to="/app/admin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
            >
              <Shield className="h-[18px] w-[18px]" />
              Admin
            </NavLink>
          )}
        </nav>

        {/* User / account menu */}
        <div className="px-3 py-3 border-t border-[#f0f0f0] relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setAccountOpen((o) => !o)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
              {emailToInitial(user?.email)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm text-slate-800 font-medium truncate">
                {emailToDisplayName(user?.email)}
              </div>
              <div className="text-[11px] text-slate-400 capitalize truncate">{primaryRole}</div>
            </div>
            <ChevronUp
              className={`h-4 w-4 text-slate-400 transition-transform ${accountOpen ? '' : 'rotate-180'}`}
            />
          </button>

          {accountOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-[#e5e5e5] bg-white shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-[#f0f0f0]">
                <div className="text-[12px] text-slate-400">Signed in as</div>
                <div className="text-[13px] text-slate-800 truncate">{user?.email ?? '—'}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 -ml-1.5 text-slate-500"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-[15px] font-semibold text-slate-900 tracking-[-0.025em]">{title}</h1>
          </div>
          <NavLink
            to="/app/leads?new=1"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Lead
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#fafafa]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
