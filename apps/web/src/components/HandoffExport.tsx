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

      {/* CRM Export — CSV */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">CRM Export</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCsv}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy CSV'}
            </button>
            <button
              onClick={downloadExcel}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors"
              title="UTF-8 BOM + CRLF — open directly in Excel on Windows"
            >
              ⬇ Excel CSV
            </button>
            <button
              onClick={downloadCrm}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-light)] transition-colors"
              title="Plain CSV optimized for CRM importers (Monday, HubSpot, Salesforce, Pipedrive…)"
            >
              ⬇ Download CSV (CRM)
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--color-muted)] mb-4">
          The <strong>CRM</strong> file uses minimal quoting and no BOM — required for Monday.com, Pipedrive and Zoho.
          The <strong>Excel</strong> variant adds a UTF-8 BOM and CRLF endings so Excel on Windows opens it with correct encoding.
        </p>

        {/* Preview table */}
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
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
          <pre className="mt-2 text-xs bg-[var(--color-surface-alt)] p-3 rounded-lg overflow-x-auto font-mono whitespace-pre">
{csvCrm}
          </pre>
        </details>
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
