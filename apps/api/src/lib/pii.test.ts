import { describe, it, expect } from 'vitest';
import type { TranscriptLine } from '@dealpilot/shared';
import { redactPII, redactTranscript } from './pii.js';

describe('redactPII', () => {
  it('masks email addresses', () => {
    const out = redactPII('Reach me at jane.doe@acme.co anytime');
    expect(out).toContain('[redacted-email]');
    expect(out).not.toContain('jane.doe@acme.co');
  });

  it('masks phone numbers in common formats', () => {
    for (const p of ['+1 (415) 555-0192', '415-555-0192', '4155550192']) {
      const out = redactPII(`Call ${p} please`);
      expect(out, p).toContain('[redacted-phone]');
      expect(out, p).not.toContain('0192');
    }
  });

  it('leaves non-PII text untouched', () => {
    const t = 'We need 50 voice rooms with low latency';
    expect(redactPII(t)).toBe(t);
  });
});

describe('redactTranscript (per-session scoping)', () => {
  it('redacts only the lines passed in and preserves speaker/timestamp', () => {
    const lines: TranscriptLine[] = [
      { speaker: 'PROSPECT', text: 'Email is bob@x.io', timestamp: '2026-01-01T00:00:00Z' },
      { speaker: 'AI', text: 'Thanks, noted.', timestamp: '2026-01-01T00:00:01Z' },
    ];
    const out = redactTranscript(lines);
    expect(out[0].text).toBe('Email is [redacted-email]');
    expect(out[0].speaker).toBe('PROSPECT');
    expect(out[0].timestamp).toBe('2026-01-01T00:00:00Z');
    expect(out[1].text).toBe('Thanks, noted.');
    // input not mutated (no cross-session/state bleed)
    expect(lines[0].text).toBe('Email is bob@x.io');
  });
});
