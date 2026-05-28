import { ArrowRight } from 'lucide-react';

export default function MidBanner() {
  return (
    <section className="bg-zinc-900 px-6 py-20">
      <div className="mx-auto max-w-4xl text-center space-y-6">
        <h2 className="text-3xl font-bold text-white md:text-4xl">Built for B2B sales teams that move fast.</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          DealPilot AI plugs into your existing workflow — Agora voice, Deepgram STT, ElevenLabs TTS, and Claude for intelligence. Your reps stay in control while AI handles the technical heavy lifting.
        </p>
        <a href="/book-demo" className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-zinc-300 transition-colors">
          See it in action <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
