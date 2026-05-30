import { createHash } from 'node:crypto';

/**
 * Consent logging for the prospect's explicit opt-in to talk with an AI
 * (Golden Rule: consent before mic capture). We MUST NOT persist raw PII —
 * the client IP is one-way hashed and nothing else identifying is stored.
 */
export interface ConsentRecord {
  sessionId: string;
  consentedAt: string;
  /** SHA-256 of the IP (salted-ish by a fixed prefix). Not reversible to PII. */
  ipHash: string;
}

const log: ConsentRecord[] = [];

export function hashIp(ip: string | undefined | null): string {
  return createHash('sha256').update(`dealpilot:${ip ?? 'unknown'}`).digest('hex').slice(0, 16);
}

export function recordConsent(sessionId: string, ip: string | undefined | null): ConsentRecord {
  const record: ConsentRecord = {
    sessionId,
    consentedAt: new Date().toISOString(),
    ipHash: hashIp(ip),
  };
  log.push(record);
  // Audit line contains no raw PII (only the hash).
  console.log(`[consent] session=${sessionId} ipHash=${record.ipHash} at=${record.consentedAt}`);
  return record;
}

export function hasConsent(sessionId: string): boolean {
  return log.some((r) => r.sessionId === sessionId);
}
