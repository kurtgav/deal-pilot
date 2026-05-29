import { Mic, Brain, FileText } from 'lucide-react';

const metrics = [
  { icon: Mic, title: 'Voice Discovery', desc: 'AI joins live calls and asks dynamic qualifying questions — extracting pain points, budget signals, and urgency in real time.', color: 'text-blue-600 bg-blue-50' },
  { icon: Brain, title: 'Technical Q&A', desc: 'Answers product and integration questions from your knowledge base via RAG — no hallucination, no guessing.', color: 'text-violet-600 bg-violet-50' },
  { icon: FileText, title: 'CRM Handoff', desc: 'Generates a complete post-call package: transcript, lead score, CRM CSV, and personalized follow-up email draft.', color: 'text-amber-600 bg-amber-50' },
];

export default function MetricsGrid() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-zinc-900 mb-12">How DealPilot AI works on every call</h2>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 grid gap-6 sm:grid-cols-3">
            {metrics.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-xl border border-zinc-100 bg-white p-5 space-y-3">
                <div className={`inline-flex rounded-lg p-2 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-zinc-900">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
            <p className="text-xs font-medium text-zinc-400 mb-3">Live Call — Field Extraction</p>
            <div className="rounded-lg bg-white border border-zinc-200 p-4 text-sm text-zinc-700 leading-relaxed">
              <p className="mb-3 italic text-zinc-500">"We need real-time voice rooms for our tutoring platform — about 500 concurrent sessions."</p>
              <div className="space-y-2 border-t border-zinc-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Use Case: Live tutoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Urgency: High</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">Lead Score: 82/100</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Package: Enterprise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
