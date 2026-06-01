import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { percentile, latencyStats, meetsTarget, LATENCY_TARGET_MS } from './latency.js';

describe('percentile', () => {
  it('returns 0 for an empty set', () => {
    assert.equal(percentile([], 50), 0);
  });
  it('computes nearest-rank p50 and p95', () => {
    const s = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    assert.equal(percentile(s, 50), 500);
    assert.equal(percentile(s, 95), 1000);
  });
  it('is order-independent', () => {
    assert.equal(percentile([300, 100, 200], 50), 200);
  });
});

describe('latencyStats', () => {
  it('reports zeros for no samples', () => {
    assert.deepEqual(latencyStats([]), { count: 0, p50: 0, p95: 0, withinTarget: 0 });
  });
  it('computes the within-target fraction against the 1.5s NFR', () => {
    // 3 of 4 within 1500ms.
    const stats = latencyStats([800, 1200, 1400, 2000]);
    assert.equal(stats.count, 4);
    assert.equal(stats.withinTarget, 0.75);
  });
});

describe('meetsTarget', () => {
  it('uses the 1.5s default budget', () => {
    assert.equal(LATENCY_TARGET_MS, 1500);
    assert.equal(meetsTarget(1500), true);
    assert.equal(meetsTarget(1501), false);
  });
});
