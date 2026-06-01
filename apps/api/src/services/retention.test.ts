import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const repo = { purgeExpiredTranscripts: vi.fn(async () => 2) };
vi.mock('../db/repo.js', () => repo);

const { ttlHours, sweepExpiredTranscripts } = await import('./retention.js');

beforeEach(() => vi.clearAllMocks());
afterEach(() => { delete process.env.TRANSCRIPT_TTL_HOURS; });

describe('ttlHours', () => {
  it('defaults to 24h', () => {
    expect(ttlHours()).toBe(24);
  });
  it('honors a positive override', () => {
    process.env.TRANSCRIPT_TTL_HOURS = '1';
    expect(ttlHours()).toBe(1);
  });
  it('ignores invalid/non-positive overrides', () => {
    process.env.TRANSCRIPT_TTL_HOURS = '-5';
    expect(ttlHours()).toBe(24);
  });
});

describe('sweepExpiredTranscripts', () => {
  it('purges with a cutoff exactly TTL hours before now and returns the count', async () => {
    process.env.TRANSCRIPT_TTL_HOURS = '24';
    const now = new Date('2026-01-02T00:00:00.000Z');
    const count = await sweepExpiredTranscripts(now);
    expect(count).toBe(2);
    expect(repo.purgeExpiredTranscripts).toHaveBeenCalledWith('2026-01-01T00:00:00.000Z');
  });
});
