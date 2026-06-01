import * as repo from '../db/repo.js';

/**
 * Transcript retention (Golden Rule #4). Verbatim transcripts hold prospect PII
 * (names/emails/phones spoken aloud) and must not persist beyond session scope.
 * We keep them for a bounded review window (TTL) so the rep can review the call
 * post-handoff (PRD F5.1), then auto-purge. Default 24h; override via
 * TRANSCRIPT_TTL_HOURS.
 */
export function ttlHours(): number {
  const n = Number(process.env.TRANSCRIPT_TTL_HOURS);
  return Number.isFinite(n) && n > 0 ? n : 24;
}

/** Delete-by-emptying transcripts whose review window (now - TTL) has elapsed.
 *  Returns the number of sessions purged. */
export async function sweepExpiredTranscripts(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ttlHours() * 3600_000).toISOString();
  return repo.purgeExpiredTranscripts(cutoff);
}
