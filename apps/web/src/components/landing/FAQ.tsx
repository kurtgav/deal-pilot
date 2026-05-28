import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'How does DealPilot AI join a sales call?', a: 'DealPilot AI joins as a named participant on your voice call via Agora RTC. Your rep starts the call from the dashboard, and the AI handles discovery, Q&A, and objection handling in real time.' },
  { q: 'Will the AI hallucinate product information?', a: 'No. All product and technical answers come from your curated knowledge base via RAG retrieval. If a question falls outside scope, the AI flags it for human follow-up instead of guessing.' },
  { q: 'Can my rep override or mute the AI mid-call?', a: 'Yes. The sales rep retains full control at all times — they can mute, pause, or end the AI at any point during the call. The AI never talks over the rep.' },
  { q: 'What happens after the call ends?', a: 'DealPilot generates a complete handoff package: full transcript, lead qualification score (0–100), CRM-ready JSON export, and a personalized follow-up email draft — all within seconds.' },
  { q: 'Does DealPilot replace my sales engineers?', a: 'No. DealPilot handles routine technical discovery so your SEs can focus on complex, high-value engagements. It eliminates the scheduling bottleneck, not the role.' },
  { q: 'What voice and AI infrastructure does it use?', a: 'Agora RTC for voice, Deepgram for real-time speech-to-text, ElevenLabs for natural AI voice output, and Anthropic Claude for intelligent conversation and field extraction.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="px-6 py-24 bg-zinc-50/50">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold text-zinc-900 mb-10 text-center">Frequently asked questions</h2>
        <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                {faq.q}
                <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-zinc-500 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
