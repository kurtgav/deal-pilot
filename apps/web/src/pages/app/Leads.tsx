import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lead } from '@dealpilot/shared';
import { api } from '../../lib/api';
import { toast } from '../../components/Toaster';
import { Search } from 'lucide-react';

const fallbackLeads: Lead[] = [
  { id: 'demo-1', contactName: 'Maya Chen', company: 'NovaStack Labs', industry: 'Developer Tools', initialUseCase: 'API development platform', status: 'sql', createdAt: '2026-05-26T14:30:00Z' },
  { id: 'demo-2', contactName: 'Rafael Santos', company: 'CloudCart PH', industry: 'E-commerce SaaS', initialUseCase: 'Multi-vendor marketplace integrations', status: 'in_call', createdAt: '2026-05-26T14:15:00Z' },
  { id: 'demo-3', contactName: 'Anika Reyes', company: 'FinOpsly', industry: 'Fintech', initialUseCase: 'Cloud cost optimization', status: 'sql', createdAt: '2026-05-25T10:15:00Z' },
  { id: 'demo-4', contactName: 'James Liu', company: 'DataStream AI', industry: 'Data Analytics', initialUseCase: 'Real-time data pipelines', status: 'new', createdAt: '2026-05-24T09:00:00Z' },
  { id: 'demo-5', contactName: 'Sarah Johnson', company: 'HealthTrack Pro', industry: 'Healthcare SaaS', initialUseCase: 'Patient engagement workflow', status: 'new', createdAt: '2026-05-23T16:00:00Z' },
];

const statusLabel: Record<string, string> = { new: 'New', sql: 'Qualified', in_call: 'In Call', disqualified: 'Disqualified' };
const statusColor: Record<string, string> = { new: 'bg-slate-100 text-slate-600', sql: 'bg-emerald-50 text-emerald-700', in_call: 'bg-indigo-50 text-indigo-700', disqualified: 'bg-red-50 text-red-600' };

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => {
    api.getLeads()
      .then(setLeads)
      .catch(() => { setLeads(fallbackLeads); toast('Could not load leads — showing sample data.', 'error'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l =>
    l.contactName.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-6 max-w-7xl">
      {/* Main table */}
      <div className="flex-1 min-w-0">
        <div className="dash-card">
          <div className="px-5 py-3 border-b border-[#f0f0f0]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[14px] bg-transparent border-none outline-none placeholder:text-slate-300"
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[12px] font-medium text-slate-400 uppercase tracking-wider border-b border-[#f0f0f0]">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Industry</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => setSelected(lead)}
                  className={`border-t border-[#f5f5f5] cursor-pointer transition-colors hover:bg-slate-50/60 ${selected?.id === lead.id ? 'bg-indigo-50/40' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <Link to={`/app/leads/${lead.id}`} className="text-[14px] font-medium text-slate-900 hover:text-indigo-600">{lead.contactName}</Link>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-500">{lead.company}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-500">{lead.industry}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${statusColor[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel[lead.status] || lead.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-[14px] text-slate-400">
                    {leads.length === 0 ? 'No leads yet. Add your first lead to get started.' : 'No leads match your search.'}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-[14px] text-slate-400">Loading leads…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side preview (xl only) */}
      {selected && (
        <div className="hidden xl:block w-80 shrink-0">
          <div className="dash-card p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-semibold text-indigo-600">
                {selected.contactName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-slate-900">{selected.contactName}</div>
                <div className="text-[13px] text-slate-400">{selected.company}</div>
              </div>
            </div>
            <div className="space-y-3 text-[13px]">
              <div><span className="text-slate-400">Industry:</span> <span className="text-slate-700 ml-2">{selected.industry}</span></div>
              <div><span className="text-slate-400">Use Case:</span> <span className="text-slate-700 ml-2">{selected.initialUseCase}</span></div>
              <div><span className="text-slate-400">Status:</span> <span className="text-slate-700 ml-2">{statusLabel[selected.status] || selected.status}</span></div>
            </div>
            <Link
              to={`/app/leads/${selected.id}`}
              className="mt-5 w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
