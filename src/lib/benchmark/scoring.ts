import type { GRProvider } from './data';

/** Jitter = P99 - P50 */
export function computeJitter(p: GRProvider): number {
  return Math.round(p.p99 - p.p50);
}

/** Value score: score per dollar per million requests. Free = Infinity. */
export function computeValueScore(p: GRProvider): number {
  if (p.costPerM === 0) return Infinity;
  return Math.round(p.score / p.costPerM);
}

/** Delta vs the fastest P50 provider */
export function computeDelta(p: GRProvider, fastest: GRProvider): number {
  return Math.round(p.p50 - fastest.p50);
}

/** Latency colour threshold */
export function latencyColor(ms: number, palette: { green: string; amber: string; red: string }) {
  if (ms <= 20)  return palette.green;
  if (ms <= 100) return palette.amber;
  return palette.red;
}

export function p9xColor(ms: number, palette: { amber: string; red: string; textSecondary: string }) {
  if (ms <= 300) return palette.amber;
  return palette.red;
}

export function jitterColor(ms: number, palette: { green: string; amber: string; red: string }) {
  if (ms <= 150) return palette.green;
  if (ms <= 400) return palette.amber;
  return palette.red;
}

export function uptimeColor(pct: number, palette: { green: string; amber: string; red: string }) {
  if (pct >= 99) return palette.green;
  if (pct >= 95) return palette.amber;
  return palette.red;
}

/** Re-compute ranks from live-updated providers */
export function rerank(providers: GRProvider[]): GRProvider[] {
  const sorted = [...providers].sort((a, b) => b.score - a.score);
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}

/** Find the category winners */
export function computeWinners(providers: GRProvider[]) {
  const byP50    = [...providers].sort((a, b) => a.p50 - b.p50);
  const byUptime = [...providers].sort((a, b) => b.uptime - a.uptime || a.errRate - b.errRate);
  const byRps    = [...providers].sort((a, b) => b.rps - a.rps);
  // Best value: paid only; if all free, use score
  const paid     = providers.filter((p) => p.costPerM > 0);
  const bestValue = paid.length > 0
    ? paid.reduce((a, b) => computeValueScore(a) > computeValueScore(b) ? a : b)
    : byP50[0];

  return {
    speed:      byP50[0],
    reliability: byUptime[0],
    throughput:  byRps[0],
    value:       bestValue,
    overall:     providers.find((p) => p.rank === 1) ?? byP50[0],
  };
}

/** Compute radar dimensions (0-100) for each provider */
export function computeRadarDimensions(p: GRProvider, allProviders: GRProvider[]) {
  const maxP50  = Math.max(...allProviders.map((x) => x.p50), 1);
  const maxRps  = Math.max(...allProviders.map((x) => x.rps), 1);
  const maxCap  = 100;

  return {
    Speed:      Math.round(Math.max(0, (1 - p.p50 / maxP50)) * 100),
    Uptime:     Math.round(p.uptime),
    Throughput: Math.round(Math.min(100, (p.rps / maxRps) * 100)),
    Reliability:Math.round(Math.max(0, 100 - p.errRate * 10)),
    Coverage:   p.capabilities.capScore,
  };
}
