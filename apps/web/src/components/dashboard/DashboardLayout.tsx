import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowUpDown, Database, Settings, Plus, Menu, X } from 'lucide-react';

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
};

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = titles[pathname] || (pathname.startsWith('/app/leads/') ? 'Lead Detail' : 'Dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className={`dash-sidebar fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
        </nav>

        <div className="px-4 py-4 border-t border-[#f0f0f0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">U</div>
            <div className="text-sm text-slate-700 font-medium">User</div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 -ml-1.5 text-slate-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-[15px] font-semibold text-slate-900 tracking-[-0.025em]">{title}</h1>
          </div>
          <NavLink
            to="/app/leads"
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
