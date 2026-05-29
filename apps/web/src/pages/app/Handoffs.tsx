import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Handoff } from '@dealpilot/shared';
import { api } from '../../lib/api';
import { ArrowRight } from 'lucide-react';

export default function Handoffs() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHandoffs()
      .then(setHandoffs)
      .catch(() => setHandoffs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-4xl text-center py-16 text-[14px] text-slate-400">Loading handoffs…</div>;
  }

  return (
    <div className="max-w-4xl space-y-4">
      {handoffs.map(h => {
        const name = h.crmJson?.contact || 'Prospect';
        const company = h.crmJson?.company || '';
        return (
          <div key={h.sessionId} className="dash-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
                {name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-slate-900">{name} <span className="text-slate-400 font-normal">· {company}</span></div>
                <div className="text-[13px] text-slate-500 mt-0.5 truncate">{h.qualification?.recommendedNextStep || h.summary}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-[13px] font-medium text-slate-700">{h.qualification?.score}/100</div>
                <div className="text-[12px] text-slate-400">{h.qualification?.dealStage}</div>
              </div>
              <Link to={`/handoff/${h.sessionId}`} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}

      {handoffs.length === 0 && (
        <div className="text-center py-16 text-[14px] text-slate-400">No handoffs yet. Complete a call to generate one.</div>
      )}
    </div>
  );
}
