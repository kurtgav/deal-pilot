import type { Lead } from '@dealpilot/shared';

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  in_call: 'bg-amber-50 text-amber-700',
  sql: 'bg-green-50 text-green-700',
  disqualified: 'bg-slate-100 text-slate-500',
};

export default function LeadCard({ lead, onStartCall }: { lead: Lead; onStartCall: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-sm font-semibold text-[var(--color-accent)]">
            {lead.contactName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-medium">{lead.contactName}</h3>
            <p className="text-sm text-[var(--color-muted)]">{lead.company} · {lead.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
            {lead.status === 'in_call' ? 'In Call' : lead.status === 'sql' ? 'SQL' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>
          {lead.status === 'new' && (
            <button onClick={() => onStartCall(lead.id)} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-light)] transition-colors">
              Start Call
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted)] pl-14">{lead.initialUseCase}</p>
    </div>
  );
}
