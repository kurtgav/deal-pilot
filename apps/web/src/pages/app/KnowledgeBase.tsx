import { Database, FileText, Globe, Shield } from 'lucide-react';

const sources = [
  { name: 'Product Documentation', type: 'Docs', items: 24, progress: 100, icon: FileText },
  { name: 'Competitor Analysis', type: 'Research', items: 8, progress: 75, icon: Globe },
  { name: 'Pricing & Packaging', type: 'Internal', items: 3, progress: 100, icon: Database },
  { name: 'Objection Handling', type: 'Playbook', items: 12, progress: 60, icon: Shield },
];

const rules = [
  'Never discuss pricing below published tiers without manager approval',
  'Always confirm the prospect\u2019s current solution before positioning',
  'Avoid making commitments on unreleased features or timelines',
  'Redirect compliance questions to the security team for detailed answers',
];

export default function KnowledgeBase() {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Sources grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sources.map(s => (
          <div key={s.name} className="dash-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <div className="text-[14px] font-medium text-slate-900">{s.name}</div>
                <div className="text-[12px] text-slate-400">{s.items} items · {s.type}</div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${s.progress}%` }} />
            </div>
            <div className="text-[12px] text-slate-400 mt-1.5">{s.progress}% indexed</div>
          </div>
        ))}
      </div>

      {/* Grounding rules */}
      <div className="dash-card p-6">
        <h2 className="text-[14px] font-semibold text-slate-900 mb-4">Grounding Rules</h2>
        <ul className="space-y-3">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-medium text-slate-500 shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-[14px] text-slate-600 leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
