import { useEffect, useRef } from 'react';
import type { TranscriptLine } from '@dealpilot/shared';

const speakerStyles: Record<string, { label: string; color: string }> = {
  AI: { label: 'DealPilot AI', color: 'text-[var(--color-accent)]' },
  PROSPECT: { label: 'Prospect', color: 'text-emerald-600' },
  REP: { label: 'Rep', color: 'text-amber-600' },
};

export default function Transcript({ lines }: { lines: TranscriptLine[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines.length]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {lines.length === 0 && (
        <p className="text-sm text-[var(--color-muted)] text-center mt-10">Waiting for conversation to begin...</p>
      )}
      {lines.map((line, i) => {
        const style = speakerStyles[line.speaker] || speakerStyles.PROSPECT;
        return (
          <div key={i} className="animate-field-flash -mx-2 rounded-2xl border border-slate-200/70 bg-white/65 p-3 shadow-sm">
            <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
            <p className="text-sm mt-0.5 leading-relaxed">{line.text}</p>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
