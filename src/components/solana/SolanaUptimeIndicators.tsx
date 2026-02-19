'use client';

import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

function UptimeDots({ pct }: { pct: number }) {
  const total = 20;
  const filled = Math.round((pct / 100) * total);
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-sm ${
            i < filled ? 'bg-green-500' : 'bg-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export function SolanaUptimeIndicators({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => b.metrics.uptime_percent - a.metrics.uptime_percent);

  return (
    <div className="space-y-3">
      {sorted.map((p) => {
        const pct = p.metrics.uptime_percent;
        const color =
          pct >= 99.5 ? 'text-green-600 dark:text-green-400' :
          pct >= 98 ? 'text-yellow-600 dark:text-yellow-400' :
          'text-red-600 dark:text-red-400';
        const dotColor =
          pct >= 99.5 ? 'bg-green-500' :
          pct >= 98 ? 'bg-yellow-500' :
          'bg-red-500';

        return (
          <div key={p.id} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dotColor}`} />
                <span className={p.is_us ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-foreground'}>
                  {p.is_us ? `★ ${p.name}` : p.name}
                </span>
              </span>
              <span className={`text-[11px] font-mono tabular-nums font-medium ${color}`}>
                {pct.toFixed(2)}%
              </span>
            </div>
            <UptimeDots pct={pct} />
          </div>
        );
      })}
    </div>
  );
}
