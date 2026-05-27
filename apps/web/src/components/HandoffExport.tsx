import type { Handoff } from '@dealpilot/shared';

export default function HandoffExport({ handoff }: { handoff: Handoff }) {
  const copyJson = () => navigator.clipboard.writeText(JSON.stringify(handoff.crmJson, null, 2));
  const copyEmail = () => navigator.clipboard.writeText(handoff.followUpEmailDraft);

  return (
    <div className="space-y-8">
      {/* Summary */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">Call Summary</h3>
        <p className="text-sm leading-relaxed">{handoff.summary}</p>
      </section>

      {/* Qualification */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Qualification</h3>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Score" value={`${handoff.qualification.score}/100`} />
          <Stat label="Deal Stage" value={handoff.qualification.dealStage} />
          <Stat label="Product Fit" value={handoff.qualification.productFit} />
          <Stat label="Urgency" value={handoff.qualification.urgency} />
          <Stat label="Budget Signal" value={handoff.qualification.budgetSignal} />
          <Stat label="Next Step" value={handoff.qualification.recommendedNextStep} />
        </div>
      </section>

      {/* CRM JSON */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">CRM Export (JSON)</h3>
          <button onClick={copyJson} className="text-xs text-[var(--color-accent)] hover:underline">Copy</button>
        </div>
        <pre className="text-xs bg-[var(--color-surface-alt)] p-4 rounded-lg overflow-x-auto font-mono">
          {JSON.stringify(handoff.crmJson, null, 2)}
        </pre>
      </section>

      {/* Follow-up Email */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Follow-up Email Draft</h3>
          <button onClick={copyEmail} className="text-xs text-[var(--color-accent)] hover:underline">Copy</button>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap bg-[var(--color-surface-alt)] p-4 rounded-lg">
          {handoff.followUpEmailDraft}
        </div>
      </section>

      {/* Flagged Questions */}
      {handoff.flaggedQuestions.length > 0 && (
        <section className="bg-white rounded-xl border border-amber-200 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-700 mb-3">⚠ Flagged for Human Follow-up</h3>
          <ul className="space-y-2">
            {handoff.flaggedQuestions.map((q, i) => (
              <li key={i} className="text-sm text-amber-800">• {q}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-alt)]">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}
