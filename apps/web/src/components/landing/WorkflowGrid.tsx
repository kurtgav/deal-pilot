import { Mic, Brain, Shield, FileText, Zap, Bell } from 'lucide-react';

const blocks = [
  { icon: Mic, title: 'Structured Voice Discovery', desc: 'AI asks dynamic qualifying questions and extracts fields in real time.' },
  { icon: Brain, title: 'RAG-Powered Product Q&A', desc: 'Answers technical questions from your knowledge base — never hallucinates.' },
  { icon: Shield, title: 'Objection Handling', desc: 'Detects objections mid-call and responds with trained rebuttals.' },
  { icon: Zap, title: 'Real-Time Lead Scoring', desc: 'Scores prospects 0–100 based on urgency, budget, and technical fit.' },
];

const notifications = [
  'Prospect asked about SOC 2 compliance — answered from knowledge base',
  'Objection detected: "integration timeline concerns" — rebuttal delivered',
];

export default function WorkflowGrid() {
  return (
    <section className="px-6 py-24 bg-zinc-50/50">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-zinc-900 mb-12">An AI sales engineer that handles the hard parts</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-zinc-100 bg-white p-6 space-y-3 hover:shadow-md transition-shadow">
              <Icon className="h-5 w-5 text-zinc-700" />
              <h3 className="font-semibold text-zinc-900 text-sm">{title}</h3>
              <p className="text-sm text-zinc-500">{desc}</p>
            </div>
          ))}

          <div className="rounded-xl border border-zinc-100 bg-white p-6 space-y-3 sm:col-span-2 lg:col-span-2 hover:shadow-md transition-shadow">
            <FileText className="h-5 w-5 text-zinc-700" />
            <h3 className="font-semibold text-zinc-900 text-sm">Post-Call Handoff Generation</h3>
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-2">
              {notifications.map((n) => (
                <div key={n} className="flex items-start gap-2 rounded-md bg-white border border-zinc-100 p-3 text-xs text-zinc-700 shadow-sm">
                  <Bell className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
