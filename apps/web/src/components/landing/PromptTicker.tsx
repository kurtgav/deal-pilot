import { Mic } from 'lucide-react';

const prompts = [
  'How does DealPilot handle technical questions mid-call?',
  'Can the AI answer SDK and API integration questions?',
  'What happens when a prospect raises an objection?',
  'How fast is the AI voice response?',
  'Does DealPilot generate CRM-ready JSON after calls?',
  'Can my rep mute or override the AI during a call?',
];

export default function PromptTicker() {
  return (
    <section className="py-16 overflow-hidden border-y border-zinc-100 bg-zinc-50/30">
      <div className="flex animate-[scroll_30s_linear_infinite] gap-6 w-max">
        {[...prompts, ...prompts].map((p, i) => (
          <div key={i} className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm text-zinc-600 whitespace-nowrap shadow-sm">
            <span>{p}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-white font-medium">
              <Mic className="h-3 w-3" /> Ask AI
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
