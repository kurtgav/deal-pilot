import { useMemo, useState } from 'react';
import type { Handoff, Lead } from '@dealpilot/shared';
import {
  CRM_COLUMNS,
  buildCsvFilename,
  downloadCsv,
  handoffToCrmRow,
  rowsToCsv,
  rowsToExcelCsv,
} from '../lib/csvExport';

interface Props {
  handoff: Handoff;
  lead?: Lead | null;
}

export default function HandoffExport({ handoff, lead }: Props) {
  const [copied, setCopied] = useState(false);

  const leadCtx = useMemo(
    () => ({
      contactName: lead?.contactName ?? handoff.crmJson.contact,
      company: lead?.company ?? handoff.crmJson.company,
      industry: lead?.industry ?? handoff.crmJson.industry,
    }),
    [lead, handoff],
  );

  const row = useMemo(() => handoffToCrmRow(handoff, leadCtx), [handoff, leadCtx]);
  const csvCrm = useMemo(() => rowsToCsv([row]), [row]);
  const csvExcel = useMemo(() => rowsToExcelCsv([row]), [row]);

  const downloadCrm = () => {
    const filename = buildCsvFilename(leadCtx.company || leadCtx.contactName, handoff.generatedAt);
    downloadCsv(filename, csvCrm);
  };

  const downloadExcel = () => {
    const filename = buildCsvFilename(
      leadCtx.company || leadCtx.contactName,
      handoff.generatedAt,
      'excel',
    );
    downloadCsv(filename, csvExcel);
  };

  const handleCopyCsv = async () => {
    try {
      await navigator.clipboard.writeText(csvCrm);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const copyEmail = () => navigator.clipboard.writeText(handoff.followUpEmailDraft);

  return (
    <div className="space-y-8">
      {/* Summary */}
      <section className="app-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">Call Summary</h3>
        <p className="text-sm leading-relaxed">{handoff.summary}</p>
      </section>

      {/* Qualification */}
      <section className="app-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-4">Qualification</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Score" value={`${handoff.qualification.score}/100`} />
          <Stat label="Deal Stage" value={handoff.qualification.dealStage} />
          <Stat label="Product Fit" value={handoff.qualification.productFit} />
          <Stat label="Urgency" value={handoff.qualification.urgency} />
          <Stat label="Budget Signal" value={handoff.qualification.budgetSignal} />
          <Stat label="Next Step" value={handoff.qualification.recommendedNextStep} />
        </div>
      </section>

      {/* CRM Export — CSV */}
      <section className="app-card p-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">CRM Export</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCsv}
              className="app-button-secondary px-3 py-1.5 text-xs"
            >
              {copied ? 'Copied' : 'Copy CSV'}
            </button>
            <button
              onClick={downloadExcel}
              className="app-button-secondary px-3 py-1.5 text-xs"
              title="UTF-8 BOM + CRLF — open directly in Excel on Windows"
            >
              Excel CSV
            </button>
            <button
              onClick={downloadCrm}
              className="app-button-primary px-3 py-1.5 text-xs"
              title="Plain CSV optimized for CRM importers (Monday, HubSpot, Salesforce, Pipedrive…)"
            >
              Download CSV (CRM)
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--color-muted)] mb-4">
          The <strong>CRM</strong> file uses minimal quoting and no BOM — required for Monday.com, Pipedrive and Zoho.
          The <strong>Excel</strong> variant adds a UTF-8 BOM and CRLF endings so Excel on Windows opens it with correct encoding.
        </p>

        {/* Preview table */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/80">
          <table className="w-full text-sm">
            <tbody>
              {CRM_COLUMNS.map((col, i) => (
                <tr
                  key={col}
                  className={i % 2 === 0 ? 'bg-[var(--color-surface-alt)]' : 'bg-white'}
                >
                  <td className="px-4 py-2 font-medium text-[var(--color-muted)] w-1/3 align-top whitespace-nowrap">
                    {col}
                  </td>
                  <td className="px-4 py-2 break-words">
                    {String(row[col] ?? '') || <span className="text-[var(--color-muted)] italic">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details className="mt-4">
          <summary className="text-xs text-[var(--color-muted)] cursor-pointer hover:text-[var(--color-primary)]">
            Show raw CSV (CRM variant)
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/75 p-3 font-mono text-xs whitespace-pre">
{csvCrm}
          </pre>
        </details>
      </section>

      {/* Follow-up Email */}
      <section className="app-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Follow-up Email Draft</h3>
          <button onClick={copyEmail} className="text-xs text-[var(--color-accent)] hover:underline">Copy</button>
        </div>
        <div className="whitespace-pre-wrap rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm leading-relaxed">
          {handoff.followUpEmailDraft}
        </div>
      </section>

      {/* Flagged Questions */}
      {handoff.flaggedQuestions.length > 0 && (
        <section className="app-card border-amber-200 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-700 mb-3">Flagged for Human Follow-up</h3>
          <ul className="space-y-2">
            {handoff.flaggedQuestions.map((q, i) => (
              <li key={i} className="text-sm text-amber-800">{q}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-sm">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

