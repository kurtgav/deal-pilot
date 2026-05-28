import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const handoffs = [
  { id: 'demo-1', name: 'Maya Chen', company: 'NovaStack Labs', score: 82, stage: 'SQL', nextStep: 'Schedule technical deep-dive with engineering team' },
  { id: 'demo-3', name: 'Anika Reyes', company: 'FinOpsly', score: 68, stage: 'SQL', nextStep: 'Send compliance documentation and schedule follow-up' },
  { id: 'demo-5', name: 'Sarah Johnson', company: 'HealthTrack Pro', score: 45, stage: 'Discovery', nextStep: 'Clarify data requirements and confirm decision timeline' },
];

export default function Handoffs() {
  return (
    <div className="max-w-4xl space-y-4">
      {handoffs.map(h => (
        <div key={h.id} className="dash-card p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
              {h.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-slate-900">{h.name} <span className="text-slate-400 font-normal">· {h.company}</span></div>
              <div className="text-[13px] text-slate-500 mt-0.5 truncate">{h.nextStep}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-medium text-slate-700">{h.score}/100</div>
              <div className="text-[12px] text-slate-400">{h.stage}</div>
            </div>
            <Link to={`/app/leads/${h.id}`} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ))}

      {handoffs.length === 0 && (
        <div className="text-center py-16 text-[14px] text-slate-400">No handoffs yet. Complete a call to generate one.</div>
      )}
    </div>
  );
}
