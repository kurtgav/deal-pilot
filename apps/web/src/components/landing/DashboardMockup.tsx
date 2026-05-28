import { Search, LayoutDashboard, Phone, Users, Settings, TrendingUp, ChevronDown } from 'lucide-react';

const leads = [
  { name: 'Sarah Chen', company: 'TechScale', useCase: 'Live tutoring rooms', score: 85, status: 'SQL' },
  { name: 'James Park', company: 'CloudFirst', useCase: 'Customer support voice', score: 72, status: 'In Call' },
  { name: 'Maria Lopez', company: 'Nexus AI', useCase: 'Sales automation', score: 58, status: 'New' },
  { name: 'David Kim', company: 'Orbit SaaS', useCase: 'Developer onboarding', score: 41, status: 'New' },
];

export default function DashboardMockup() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/60 overflow-hidden">
        <div className="flex min-h-[480px]">
          <aside className="w-56 shrink-0 border-r border-zinc-100 bg-zinc-50/50 p-4 space-y-4 hidden md:block">
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="truncate font-medium">Active Pipeline</span>
              <ChevronDown className="ml-auto h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
              <input className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-600 placeholder:text-zinc-400" placeholder="Search leads..." readOnly />
            </div>
            <nav className="space-y-1 text-sm">
              {[
                { icon: LayoutDashboard, label: 'Lead Dashboard', active: true },
                { icon: Phone, label: 'Call Room', active: false },
                { icon: Users, label: 'Handoffs', active: false },
                { icon: TrendingUp, label: 'Analytics', active: false },
                { icon: Settings, label: 'Knowledge Base', active: false },
              ].map(({ icon: Icon, label, active }) => (
                <div key={label} className={`flex items-center gap-2.5 rounded-md px-3 py-2 ${active ? 'bg-white text-zinc-900 shadow-sm border border-zinc-100' : 'text-zinc-500'}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              ))}
            </nav>
          </aside>

          <div className="flex-1 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-zinc-700">
                <span className="font-semibold">Lead Dashboard</span>
                <span className="text-zinc-400 mx-2">•</span>
                <span className="text-emerald-600 font-medium">3 calls</span> completed today
              </p>
              <div className="flex gap-3 text-xs">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-blue-700 font-medium">4 Active Leads</span>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700 font-medium">1 SQL</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3 rounded-xl border border-zinc-100 bg-zinc-50/30 p-4">
                <p className="text-xs font-medium text-zinc-500 mb-3">Lead Pipeline</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-100">
                      <th className="pb-2 text-left font-medium">Contact</th>
                      <th className="pb-2 text-left font-medium">Company</th>
                      <th className="pb-2 text-left font-medium">Use Case</th>
                      <th className="pb-2 text-left font-medium">Score</th>
                      <th className="pb-2 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.name} className="border-b border-zinc-50">
                        <td className="py-2.5 font-medium text-zinc-700">{l.name}</td>
                        <td className="py-2.5 text-zinc-500">{l.company}</td>
                        <td className="py-2.5 text-zinc-500">{l.useCase}</td>
                        <td className="py-2.5">
                          <span className={`font-mono text-xs ${l.score >= 80 ? 'text-emerald-600' : l.score >= 60 ? 'text-amber-600' : 'text-zinc-500'}`}>{l.score}</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${l.status === 'SQL' ? 'bg-emerald-50 text-emerald-700' : l.status === 'In Call' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-2 rounded-xl border border-zinc-100 bg-zinc-50/30 p-4">
                <p className="text-xs font-medium text-zinc-500 mb-3">Live Copilot Panel</p>
                <div className="space-y-2.5 text-xs">
                  <div className="rounded-md bg-white border border-zinc-100 p-2.5">
                    <span className="text-zinc-400">Industry:</span> <span className="text-zinc-700 font-medium">EdTech</span>
                  </div>
                  <div className="rounded-md bg-white border border-zinc-100 p-2.5">
                    <span className="text-zinc-400">Pain Point:</span> <span className="text-zinc-700 font-medium">Scheduling bottleneck with SEs</span>
                  </div>
                  <div className="rounded-md bg-white border border-zinc-100 p-2.5">
                    <span className="text-zinc-400">Budget:</span> <span className="text-emerald-600 font-medium">High</span>
                  </div>
                  <div className="rounded-md bg-white border border-zinc-100 p-2.5">
                    <span className="text-zinc-400">Technical Fit:</span> <span className="text-emerald-600 font-medium">Strong</span>
                  </div>
                  <div className="rounded-md bg-white border border-zinc-100 p-2.5">
                    <span className="text-zinc-400">Next Step:</span> <span className="text-zinc-700 font-medium">Technical deep-dive with SE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
