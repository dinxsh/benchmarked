'use client';

import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

function UptimeTier({ pct }: { pct: number }) {
  if (pct >= 99.9) return <span className="text-[10px] font-mono text-success/80 bg-success/10 px-1.5 py-0.5 rounded">99.9%+</span>;
  if (pct >= 99.5) return <span className="text-[10px] font-mono text-accent/80 bg-accent/10 px-1.5 py-0.5 rounded">≥99.5%</span>;
  if (pct >= 98)   return <span className="text-[10px] font-mono text-chart-3/80 bg-chart-3/10 px-1.5 py-0.5 rounded">≥98%</span>;
  return <span className="text-[10px] font-mono text-destructive/80 bg-destructive/10 px-1.5 py-0.5 rounded">&lt;98%</span>;
}

export function SolanaUptimeIndicators({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => b.metrics.uptime_percent - a.metrics.uptime_percent);

  return (
    <div className="space-y-4">
      {sorted.map((p, i) => {
        const pct = p.metrics.uptime_percent;
        const isExcellent = pct >= 99.9;
        const isGood      = pct >= 99.5 && !isExcellent;
        const isWarn      = pct >= 98    && !isGood && !isExcellent;

        const barColor = isExcellent ? 'var(--color-success)'
                       : isGood      ? 'var(--color-accent)'
                       : isWarn      ? 'var(--color-chart-3)'
                       :               'var(--color-destructive)';

        const textClass = isExcellent ? 'text-success'
                        : isGood      ? 'text-accent'
                        : isWarn      ? 'text-chart-3'
                        :               'text-destructive';

        return (
          <div key={p.id} className="group space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-muted-foreground/50 tabular-nums w-4 shrink-0 select-none">
                  {i + 1}
                </span>
                <span
                  className={`text-sm font-semibold truncate transition-colors ${
                    p.is_us ? 'text-accent' : 'text-foreground'
                  }`}
                >
                  {p.name}
                </span>
                {p.is_mock && (
                  <span className="text-xs text-muted-foreground/45 shrink-0">(sim)</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <UptimeTier pct={pct} />
                <span className={`text-sm font-mono tabular-nums font-bold ${textClass}`}>
                  {pct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div className="relative h-[5px] w-full bg-muted/40 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: barColor, opacity: 0.85 }}
              />
              {/* Subtle milestone ticks at 98%, 99%, 99.5% */}
              {[98, 99, 99.5].map(tick => (
                <div
                  key={tick}
                  className="absolute inset-y-0 w-px bg-background/30"
                  style={{ left: `${tick}%` }}
                />
              ))}
            </div>

            {/* Error rate context */}
            {p.metrics.error_rate > 0 && (
              <p className="text-xs text-muted-foreground/50 font-mono">
                {p.metrics.error_rate.toFixed(1)}% error rate
              </p>
            )}
          </div>
        );
      })}

      {/* Scale legend */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground/50">98%</span>
        <span className="text-[10px] text-muted-foreground/50">99%</span>
        <span className="text-[10px] text-muted-foreground/50">99.5%</span>
        <span className="text-[10px] text-muted-foreground/50">100%</span>
      </div>
    </div>
  );
}
