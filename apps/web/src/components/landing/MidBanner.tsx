import { ArrowRight } from 'lucide-react';

const stack = ['Agora', 'Deepgram', 'ElevenLabs', 'Claude'];

export default function MidBanner() {
  return (
    <section className="border-y border-zinc-100 bg-white px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Built for B2B sales teams</p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              Your reps stay in control.<br />AI handles the rest.
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              DealPilot plugs into your existing workflow. Reps run the call — the AI qualifies, answers, and generates the handoff automatically.
            </p>
          </div>

          <div className="shrink-0 space-y-3">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Powered by</p>
            <div className="flex flex-wrap gap-2">
              {stack.map((s) => (
                <span key={s} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
                  {s}
                </span>
              ))}
            </div>
            <a
              href="/book-demo"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors pt-1"
            >
              See it in action <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
