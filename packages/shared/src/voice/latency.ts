/** AI voice response must begin within this budget of the prospect's utterance
 *  end (PRD Non-Functional Requirements — Latency). */
export const LATENCY_TARGET_MS = 1500;

export interface LatencyStats {
  count: number;
  p50: number;
  p95: number;
  /** Fraction of samples within LATENCY_TARGET_MS (0–1). */
  withinTarget: number;
}

/** Nearest-rank percentile (p in [0,100]) over latency samples (ms). */
export function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[idx];
}

export function latencyStats(samples: number[], targetMs = LATENCY_TARGET_MS): LatencyStats {
  const count = samples.length;
  if (count === 0) return { count: 0, p50: 0, p95: 0, withinTarget: 0 };
  const within = samples.filter((s) => s <= targetMs).length;
  return {
    count,
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    withinTarget: within / count,
  };
}

export function meetsTarget(ms: number, targetMs = LATENCY_TARGET_MS): boolean {
  return ms <= targetMs;
}
