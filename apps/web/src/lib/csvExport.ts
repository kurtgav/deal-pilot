import type { Handoff, DealStage } from '@dealpilot/shared';

/**
 * CRM-compatible CSV export.
 *
 * Two flavors are produced:
 *
 *   1. CRM CSV (default — `rowsToCsv`)
 *      - No BOM (Monday.com, Pipedrive and Zoho reject the first header
 *        when a UTF-8 BOM is glued onto it).
 *      - Minimal quoting per RFC 4180: a field is only quoted if it
 *        contains comma, double-quote, CR or LF. Bare-word headers
 *        survive every CRM importer we've tested.
 *      - LF line endings (universally accepted).
 *      - Newlines inside cells collapsed to single spaces.
 *
 *   2. Excel CSV (`rowsToExcelCsv`)
 *      - UTF-8 BOM so Excel auto-detects encoding on Windows.
 *      - All fields quoted (Excel handles this fine).
 *      - CRLF line endings.
 *
 * Column headers use standard names recognised by every major CRM importer
 * (Salesforce, HubSpot, Pipedrive, Zoho, Close, Copper, Freshsales, Monday).
 */

export interface LeadContext {
  contactName: string;
  company: string;
  industry: string;
  email?: string;
  phone?: string;
}

// Order is fixed — header row order matches data row order.
export const CRM_COLUMNS = [
  'First Name',
  'Last Name',
  'Full Name',
  'Email',
  'Phone',
  'Company',
  'Industry',
  'Lead Source',
  'Lead Status',
  'Lifecycle Stage',
  'Deal Stage',
  'Qualification Score',
  'Use Case',
  'Pain Points',
  'Recommended Solution',
  'Urgency',
  'Budget Signal',
  'Objections',
  'Next Step',
  'Call Summary',
  'Flagged Questions',
  'Generated At',
] as const;

export type CrmColumn = (typeof CRM_COLUMNS)[number];
export type CrmRow = Record<CrmColumn, string | number>;

const LIFECYCLE_MAP: Record<DealStage, string> = {
  'Marketing Qualified Lead': 'marketingqualifiedlead',
  'Sales Qualified Lead': 'salesqualifiedlead',
  Opportunity: 'opportunity',
  'Needs Review': 'lead',
};

const LEAD_STATUS_MAP: Record<DealStage, string> = {
  'Marketing Qualified Lead': 'MQL',
  'Sales Qualified Lead': 'SQL',
  Opportunity: 'Opportunity',
  'Needs Review': 'Needs Review',
};

function splitName(full: string): { first: string; last: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/** Collapse internal whitespace (incl. CR/LF/Tab) to single spaces. */
function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'number' ? String(value) : String(value);
  return str.replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
}

/** Minimal-quoting field encoder (RFC 4180). Quotes only when required. */
function csvFieldMinimal(value: unknown): string {
  const s = normalizeCell(value);
  if (s === '') return '';
  // Quote if the field contains delimiter, quote, CR, LF, or leading/trailing whitespace.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Always-quoted field encoder (Excel-safe). */
function csvFieldQuoted(value: unknown): string {
  const s = normalizeCell(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function handoffToCrmRow(handoff: Handoff, lead: LeadContext): CrmRow {
  const { first, last } = splitName(lead.contactName);
  const crm = handoff.crmJson;
  const stage = crm.dealStage as DealStage;

  return {
    'First Name': first,
    'Last Name': last,
    'Full Name': lead.contactName,
    Email: lead.email ?? '',
    Phone: lead.phone ?? '',
    Company: crm.company || lead.company,
    Industry: crm.industry || lead.industry,
    'Lead Source': 'DealPilot AI Discovery Call',
    'Lead Status': LEAD_STATUS_MAP[stage] ?? stage,
    'Lifecycle Stage': LIFECYCLE_MAP[stage] ?? 'lead',
    'Deal Stage': stage,
    'Qualification Score': crm.qualificationScore,
    'Use Case': crm.useCase,
    'Pain Points': crm.painPoints.join('; '),
    'Recommended Solution': crm.recommendedSolution,
    Urgency: crm.urgency,
    'Budget Signal': crm.budgetSignal,
    Objections: crm.objections.join('; '),
    'Next Step': crm.nextStep,
    'Call Summary': crm.handoffSummary,
    'Flagged Questions': handoff.flaggedQuestions.join('; '),
    'Generated At': handoff.generatedAt,
  };
}

/**
 * Build a CRM-friendly CSV (no BOM, minimal quoting, LF).
 * Imports cleanly into Monday.com, Pipedrive, Zoho, HubSpot, Salesforce,
 * Close, Copper, Freshsales, Airtable, Notion.
 */
export function rowsToCsv(rows: CrmRow[]): string {
  const header = CRM_COLUMNS.map(csvFieldMinimal).join(',');
  const body = rows.map((row) => CRM_COLUMNS.map((c) => csvFieldMinimal(row[c])).join(','));
  return [header, ...body].join('\n') + '\n';
}

/**
 * Build an Excel-optimized CSV (UTF-8 BOM, CRLF, always-quoted).
 * Use when the user wants to double-click the file and have Excel open
 * it with correct UTF-8 encoding on Windows.
 */
export function rowsToExcelCsv(rows: CrmRow[]): string {
  const header = CRM_COLUMNS.map(csvFieldQuoted).join(',');
  const body = rows.map((row) => CRM_COLUMNS.map((c) => csvFieldQuoted(row[c])).join(','));
  return '\uFEFF' + [header, ...body].join('\r\n') + '\r\n';
}

export function downloadCsv(filename: string, csv: string): void {
  // Use text/csv with no charset so we don't conflict with BOM/no-BOM choice.
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildCsvFilename(companyOrName: string, isoDate: string, suffix = ''): string {
  const slug = (companyOrName || 'lead')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'lead';
  const date = (isoDate || new Date().toISOString()).slice(0, 10);
  const tag = suffix ? `_${suffix}` : '';
  return `crm-export_${slug}_${date}${tag}.csv`;
}
