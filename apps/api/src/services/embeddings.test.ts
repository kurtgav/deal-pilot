import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEmbeddingProvider, cosineSimilarity } from './embeddings.js';

afterEach(() => { vi.restoreAllMocks(); delete process.env.EMBEDDING_PROVIDER; delete process.env.NVIDIA_NIM_API_KEY; });

describe('createEmbeddingProvider selection', () => {
  it('defaults to the offline TF-IDF provider', () => {
    const p = createEmbeddingProvider();
    expect(p.prewarm).toBeUndefined(); // TF-IDF has no prewarm
  });
  it('returns the hosted provider when requested', () => {
    const p = createEmbeddingProvider('hosted');
    expect(typeof p.prewarm).toBe('function');
  });
  it('selects hosted via EMBEDDING_PROVIDER env', () => {
    process.env.EMBEDDING_PROVIDER = 'hosted';
    expect(typeof createEmbeddingProvider().prewarm).toBe('function');
  });
});

describe('HostedEmbeddingProvider', () => {
  beforeEach(() => { process.env.NVIDIA_NIM_API_KEY = 'test-key'; });

  it('serves prewarmed texts from cache as dense vectors', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ embedding: [1, 0, 0] }, { embedding: [0, 1, 0] }] }),
    }));
    vi.stubGlobal('fetch', fetchMock as any);

    const p = createEmbeddingProvider('hosted');
    p.fit(['doc a', 'doc b']);
    await p.prewarm!(['doc a', 'doc b']);

    const a = p.embed('doc a');
    const b = p.embed('doc b');
    // Dense vectors mapped to the sparse seam; orthogonal => cosine 0.
    expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5);
    expect(cosineSimilarity(a, b)).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1); // one batched call
  });

  it('does not re-fetch already-cached texts', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ data: [{ embedding: [1, 2] }] }) }));
    vi.stubGlobal('fetch', fetchMock as any);
    const p = createEmbeddingProvider('hosted');
    p.fit(['x']);
    await p.prewarm!(['x']);
    await p.prewarm!(['x']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to TF-IDF when the endpoint is unconfigured (no key)', async () => {
    delete process.env.NVIDIA_NIM_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock as any);
    const p = createEmbeddingProvider('hosted');
    p.fit(['slack salesforce integration']);
    await p.prewarm!(['slack salesforce integration']);
    expect(fetchMock).not.toHaveBeenCalled();
    // embed() still returns a usable (TF-IDF) vector — non-empty.
    expect(p.embed('slack salesforce integration').size).toBeGreaterThan(0);
  });

  it('falls back to TF-IDF on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })) as any);
    const p = createEmbeddingProvider('hosted');
    p.fit(['hello world']);
    await p.prewarm!(['hello world']);
    expect(p.embed('hello world').size).toBeGreaterThan(0); // TF-IDF fallback
  });
});
