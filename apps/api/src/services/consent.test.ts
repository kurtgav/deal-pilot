import { describe, it, expect } from 'vitest';
import { hashIp, recordConsent, hasConsent } from './consent.js';
import { enforceAIDisclosure } from './AIAgent.js';

describe('consent logging', () => {
  it('hashes the IP and never stores the raw value', () => {
    const ip = '203.0.113.42';
    const h = hashIp(ip);
    expect(h).not.toContain(ip);
    expect(h).toMatch(/^[0-9a-f]{16}$/);
    expect(hashIp(ip)).toBe(h); // deterministic
  });

  it('records and detects consent for a session', () => {
    expect(hasConsent('sess-x')).toBe(false);
    const rec = recordConsent('sess-x', '198.51.100.7');
    expect(hasConsent('sess-x')).toBe(true);
    expect(rec.ipHash).toMatch(/^[0-9a-f]{16}$/);
    expect((rec as any).ip).toBeUndefined(); // no raw PII on the record
  });
});

describe('enforceAIDisclosure', () => {
  it('keeps an intro that already discloses AI in the first sentence', () => {
    const intro = "Hi Sam, I'm DealPilot AI. How can I help?";
    expect(enforceAIDisclosure(intro, 'Sam')).toBe(intro);
  });

  it('prepends a disclosure when the intro hides that it is an AI', () => {
    const intro = 'Hey there, great to connect about your sales process!';
    const out = enforceAIDisclosure(intro, 'Sam');
    expect(out.split(/(?<=[.!?])\s/)[0]).toMatch(/\bAI\b/i);
    expect(out).toContain(intro);
  });
});
