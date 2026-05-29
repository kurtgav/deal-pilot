import { Mic, Brain, Shield, FileText, Zap } from 'lucide-react';

const stages = [
  { label: 'Intro', desc: 'AI introduces itself and opens discovery' },
  { label: 'Discovery', desc: 'Dynamic qualifying questions' },
  { label: 'Q&A', desc: 'RAG-powered product answers' },
  { label: 'Objection', desc: 'Trained rebuttal delivery' },
  { label: 'Recommend', desc: 'Package recommendation' },
  { label: 'Close', desc: 'Next-step commitment' },
];

const features = [
  { icon: Mic, title: 'Sub-1.5s voice response latency' },
  { icon: Brain, title: 'Knowledge base RAG — zero hallucination' },
  { icon: Shield, title: 'Rep retains full control (mute/pause/end)' },
  { icon: FileText, title: 'CRM CSV + follow-up email in seconds' },
  { icon: Zap, title: 'Real-time field extraction during call' },
];

export default function PortfolioMatrix() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-zinc-900 mb-12">Intelligent call flow — from intro to handoff</h2>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-xl border border-zinc-100 bg-white p-6">
            <p className="text-xs font-medium text-zinc-400 mb-6">AI Agent State Machine</p>
            <div className="space-y-3">
              {stages.map((s, i) => (
                <div key={s.label} className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-900 text-white text-xs font-bold shrink-0">{i + 1}</div>
                  <div className="flex-1 rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3">
                    <span className="font-medium text-zinc-900 text-sm">{s.label}</span>
                    <span className="text-zinc-400 mx-2">—</span>
                    <span className="text-sm text-zinc-500">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {features.map(({ icon: Icon, title }) => (
              <div key={title} className="flex items-start gap-4 rounded-xl border border-zinc-100 bg-white p-5">
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <Icon className="h-5 w-5 text-zinc-700" />
                </div>
                <p className="text-sm font-medium text-zinc-700 pt-1">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
