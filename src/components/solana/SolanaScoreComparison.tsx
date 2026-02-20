'use client';

import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

interface Dimension {
  key: string;
  label: string;
  description: string;
}

const DIMENSIONS: Dimension[] = [
  { key: 'speed',       label: 'Speed',       description: 'Inverted P50 — lower latency = higher score' },
  { key: 'uptime',      label: 'Uptime',      description: 'Measured availability %' },
  { key: 'throughput',  label: 'Throughput',  description: 'RPS normalized to 500 cap' },
  { key: 'reliability', label: 'Reliability', description: '100 minus error rate %' },
  { key: 'coverage',    label: 'Coverage',    description: 'Capabilities supported out of 6' },
];

function getDimensionScore(p: SolanaProvider, dim: string): number {
  switch (dim) {
    case 'speed':
      return Math.max(0, Math.round(100 - (p.metrics.latency_p50 / 10)));
    case 'uptime':
      return Math.min(100, Math.round(p.metrics.uptime_percent));
    case 'throughput':
      return Math.min(100, Math.round((p.metrics.throughput_rps / 500) * 100));
    case 'reliability':
      return Math.max(0, Math.round(100 - p.metrics.error_rate));
    case 'coverage': {
      const caps = p.capabilities;
      const count =
        (caps.transactions ? 1 : 0) +
        (caps.logs ? 1 : 0) +
        (caps.token_balances ? 1 : 0) +
        (caps.nft_metadata ? 1 : 0) +
        (caps.traces ? 1 : 0) +
        (caps.custom_indexing ? 1 : 0);
      return Math.round((count / 6) * 100);
    }
    default:
      return 0;
  }
}

function dimColor(dim: string, score: number): string {
  if (dim === 'speed' || dim === 'throughput') return 'var(--color-accent)';
  if (dim === 'uptime' || dim === 'reliability') {
    if (score >= 90) return 'var(--color-chart-2)';
    if (score >= 75) return 'var(--color-chart-3)';
    return 'var(--color-destructive)';
  }
  return 'var(--color-chart-5)';
}

export function SolanaScoreComparison({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => b.score - a.score);

  // Pre-compute all scores so we can find max per dimension for relative bars
  const dimMaxes = DIMENSIONS.reduce<Record<string, number>>((acc, d) => {
    acc[d.key] = Math.max(...sorted.map(p => getDimensionScore(p, d.key)), 1);
    return acc;
  }, {});

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div
        className="grid gap-2 items-center pb-2 border-b border-border/30"
        style={{ gridTemplateColumns: '130px repeat(5, 1fr) 52px' }}
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Provider</div>
        {DIMENSIONS.map(d => (
          <div
            key={d.key}
            title={d.description}
            className="text-[10px] uppercase tracking-widest text-muted-foreground/60 text-center font-semibold cursor-help"
          >
            {d.label}
          </div>
        ))}
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 text-right font-semibold">Total</div>
      </div>

      {/* Provider rows */}
      <div className="space-y-2 pt-1">
        {sorted.map((p) => (
          <div
            key={p.id}
            className="grid gap-2 items-center group py-1.5 hover:bg-muted/10 rounded-md px-1 -mx-1 transition-colors duration-150"
            style={{ gridTemplateColumns: '130px repeat(5, 1fr) 52px' }}
          >
            {/* Provider name */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground/45 tabular-nums w-4 shrink-0">
                #{p.rank}
              </span>
              <span
                className="text-xs font-semibold truncate text-foreground/90"
                title={p.name}
              >
                {p.name}
              </span>
            </div>

            {/* Dimension bars */}
            {DIMENSIONS.map(d => {
              const score = getDimensionScore(p, d.key);
              const relWidth = (score / dimMaxes[d.key]) * 100;
              const color = dimColor(d.key, score);
              return (
                <div key={d.key} className="space-y-1" title={`${d.label}: ${score}/100`}>
                  <div className="h-[5px] bg-muted/35 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${relWidth}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-muted-foreground/55 text-center leading-none font-medium">
                    {score}
                  </div>
                </div>
              );
            })}

            {/* Total composite score */}
            <div className="text-right">
              <span
                className={`text-sm font-bold font-mono tabular-nums ${
                  p.score >= 85 ? 'text-accent' : p.score >= 70 ? 'text-chart-3' : 'text-destructive/80'
                }`}
              >
                {p.score.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 pt-3 border-t border-border/25 flex-wrap">
        {[
          { label: 'Speed / Throughput', color: 'var(--color-accent)' },
          { label: 'Uptime / Reliability', color: 'var(--color-chart-2)' },
          { label: 'Coverage', color: 'var(--color-chart-5)' },
          { label: 'Warning threshold', color: 'var(--color-chart-3)' },
          { label: 'Below target', color: 'var(--color-destructive)' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="h-[4px] w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-muted-foreground/55">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
