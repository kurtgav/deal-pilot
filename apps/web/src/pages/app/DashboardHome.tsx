import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lead } from '@dealpilot/shared';
import { api } from '../../lib/api';
import { Users, Phone, ArrowUpDown, TrendingUp } from 'lucide-react';

const fallbackLeads: Lead[] = [
  { id: 'demo-1', contactName: 'Maya Chen', company: 'NovaStack Labs', industry: 'Developer Tools', initialUseCase: 'API development platform', status: 'sql', createdAt: '2026-05-26T14:30:00Z' },
  { id: 'demo-2', contactName: 'Rafael Santos', company: 'CloudCart PH', industry: 'E-commerce SaaS', initialUseCase: 'Multi-vendor marketplace integrations', status: 'in_call', createdAt: '2026-05-26T14:15:00Z' },
  { id: 'demo-3', contactName: 'Anika Reyes', company: 'FinOpsly', industry: 'Fintech', initialUseCase: 'Cloud cost optimization', status: 'sql', createdAt: '2026-05-25T10:15:00Z' },
  { id: 'demo-4', contactName: 'James Liu', company: 'DataStream AI', industry: 'Data Analytics', initialUseCase: 'Real-time data pipelines', status: 'new', createdAt: '2026-05-24T09:00:00Z' },
  { id: 'demo-5', contactName: 'Sarah Johnson', company: 'HealthTrack Pro', industry: 'Healthcare SaaS', initialUseCase: 'Patient engagement workflow', status: 'new', createdAt: '2026-05-23T16:00:00Z' },
];

const statusLabel: Record<string, string> = { new: 'New', sql: 'Qualified', in_call: 'In Call', disqualified: 'Disqualified' };
const statusColor: Record<string, string> = { new: 'bg-slate-100 text-slate-600', sql: 'bg-emerald-50 text-emerald-700', in_call: 'bg-indigo-50 text-indigo-700', disqualified: 'bg-red-50 text-red-600' };

export default function DashboardHome() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    api.getLeads().then(setLeads).catch(() => setLeads(fallbackLeads));
  }, []);

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Users },
    { label: 'Active Calls', value: leads.filter(l => l.status === 'in_call').length, icon: Phone },
    { label: 'Qualified', value: leads.filter(l => l.status === 'sql').length, icon: TrendingUp },
    { label: 'Handoffs', value: leads.filter(l => l.status === 'sql').length, icon: ArrowUpDown },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="dash-card dash-stat">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="dash-stat-value">{s.value}</div>
            <div className="dash-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="dash-card">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#f0f0f0]">
          <h2 className="text-[14px] font-semibold text-slate-900">Recent Leads</h2>
          <Link to="/app/leads" className="text-[13px] text-indigo-600 font-medium hover:text-indigo-700">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 5).map(lead => (
                <tr key={lead.id} className="border-t border-[#f5f5f5] hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <Link to={`/app/leads/${lead.id}`} className="text-[14px] font-medium text-slate-900 hover:text-indigo-600">{lead.contactName}</Link>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-500">{lead.company}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${statusColor[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/app/leads" className="dash-card p-5 hover:border-indigo-200 transition-colors group">
          <div className="text-[14px] font-medium text-slate-900 group-hover:text-indigo-600">Browse Leads</div>
          <div className="text-[13px] text-slate-400 mt-1">View and manage all leads</div>
        </Link>
        <Link to="/app/knowledge" className="dash-card p-5 hover:border-indigo-200 transition-colors group">
          <div className="text-[14px] font-medium text-slate-900 group-hover:text-indigo-600">Knowledge Base</div>
          <div className="text-[13px] text-slate-400 mt-1">Manage grounding data</div>
        </Link>
        <Link to="/app/settings" className="dash-card p-5 hover:border-indigo-200 transition-colors group">
          <div className="text-[14px] font-medium text-slate-900 group-hover:text-indigo-600">Settings</div>
          <div className="text-[13px] text-slate-400 mt-1">Configure voice agent</div>
        </Link>
      </div>
    </div>
  );
}
