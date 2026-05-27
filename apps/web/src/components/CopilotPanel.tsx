import type { ExtractedSalesFields } from '@dealpilot/shared';

function FieldRow({ label, value }: { label: string; value?: string | string[] }) {
  const display = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div className={`py-2.5 border-b border-[var(--color-border)] last:border-0 ${display ? 'animate-field-flash' : ''}`}>
      <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">{label}</p>
      <p className="text-sm mt-0.5 font-medium">{display || <span className="text-slate-300">—</span>}</p>
    </div>
  );
}

function SignalBadge({ label, value }: { label: string; value?: string }) {
  const colors: Record<string, string> = {
    High: 'bg-green-50 text-green-700 border-green-200',
    Strong: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-red-50 text-red-700 border-red-200',
    Weak: 'bg-red-50 text-red-700 border-red-200',
    Unknown: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  const style = colors[value || 'Unknown'] || colors.Unknown;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-[var(--color-muted)]">{label}</span>
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${style}`}>{value || 'Unknown'}</span>
    </div>
  );
}

export default function CopilotPanel({ fields }: { fields: ExtractedSalesFields }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="space-y-1">
        <FieldRow label="Industry" value={fields.industry} />
        <FieldRow label="Use Case" value={fields.useCase} />
        <FieldRow label="Pain Points" value={fields.painPoints} />
        <FieldRow label="Recommended Package" value={fields.recommendedPackage} />
        <FieldRow label="Next Step" value={fields.nextStep} />
      </div>

      <div className="mt-6 p-3 rounded-lg bg-[var(--color-surface-alt)]">
        <p className="text-xs font-semibold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Signals</p>
        <SignalBadge label="Budget" value={fields.budgetSignal} />
        <SignalBadge label="Urgency" value={fields.urgency} />
        <SignalBadge label="Technical Fit" value={fields.technicalFit} />
      </div>

      {fields.objections.length > 0 && (
        <div className="mt-6 p-3 rounded-lg bg-red-50 border border-red-100">
          <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wider">⚠ Objections</p>
          {fields.objections.map((o, i) => (
            <p key={i} className="text-sm text-red-800 mt-1">• {o}</p>
          ))}
        </div>
      )}
    </div>
  );
}
