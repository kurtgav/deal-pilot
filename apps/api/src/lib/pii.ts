import type { TranscriptLine } from '@dealpilot/shared';

/**
 * Pure PII redaction (Golden Rule #4 — no prospect PII beyond session scope).
 * Masks emails and phone numbers spoken/typed into the transcript. Pure and
 * dependency-free so it can run at-rest on every save and be unit-tested.
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Phone: 7+ digits allowing spaces, dashes, dots, parens and an optional +.
const PHONE_RE = /(?<!\w)\+?\d[\d\s().-]{6,}\d(?!\w)/g;

export function redactPII(text: string): string {
  return text
    .replace(EMAIL_RE, '[redacted-email]')
    .replace(PHONE_RE, '[redacted-phone]');
}

/** Redact PII from every line's text, leaving speaker/timestamp intact. */
export function redactTranscript(lines: TranscriptLine[]): TranscriptLine[] {
  return lines.map((l) => ({ ...l, text: redactPII(l.text) }));
}
