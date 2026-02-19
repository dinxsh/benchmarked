'use client';

import { Badge } from '@/components/ui/badge';

export interface SolanaProvider {
  id: string;
  name: string;
  is_us: boolean;
  rank: number;
  score: number;
  is_mock: boolean;
  metrics: {
    latency_p50: number;
    latency_p95: number;
    latency_p99: number;
    uptime_percent: number;
    throughput_rps: number;
  };
}

interface Props {
  providers: SolanaProvider[];
}

function latencyColor(ms: number): string {
  if (ms < 100) return 'text-green-600 dark:text-green-400';
  if (ms < 200) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function uptimeColor(pct: number): string {
  if (pct >= 99.5) return 'text-green-600 dark:text-green-400';
  if (pct >= 98) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function SolanaLeaderboardTable({ providers }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-2 px-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rank</th>
            <th className="py-2 px-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Provider</th>
            <th className="py-2 px-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">P50</th>
            <th className="py-2 px-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">P95</th>
            <th className="py-2 px-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">P99</th>
            <th className="py-2 px-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Uptime</th>
            <th className="py-2 px-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Throughput</th>
            <th className="py-2 px-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr
              key={p.id}
              className={`border-b border-border transition-colors ${
                p.is_us
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/30'
                  : p.rank === 1
                  ? 'bg-green-50/30 dark:bg-green-950/10 hover:bg-green-50/50 dark:hover:bg-green-950/20'
                  : 'hover:bg-muted/30'
              }`}
              style={p.is_us ? { borderLeft: '2px solid hsl(var(--accent) / 0.8)' } : undefined}
            >
              <td className="py-2.5 px-3 tabular-nums text-muted-foreground">
                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
              </td>
              <td className="py-2.5 px-3">
                <span className="flex items-center gap-1.5">
                  {p.is_us && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
                      ★ US
                    </span>
                  )}
                  <span className={`font-medium ${p.is_us ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'}`}>
                    {p.name}
                  </span>
                  {p.is_mock && (
                    <span className="text-[9px] text-muted-foreground/60">(sim)</span>
                  )}
                </span>
              </td>
              <td className={`py-2.5 px-3 text-right tabular-nums ${latencyColor(p.metrics.latency_p50)}`}>
                {p.metrics.latency_p50}ms
              </td>
              <td className={`py-2.5 px-3 text-right tabular-nums ${latencyColor(p.metrics.latency_p95)}`}>
                {p.metrics.latency_p95}ms
              </td>
              <td className={`py-2.5 px-3 text-right tabular-nums ${latencyColor(p.metrics.latency_p99)}`}>
                {p.metrics.latency_p99}ms
              </td>
              <td className={`py-2.5 px-3 text-right tabular-nums ${uptimeColor(p.metrics.uptime_percent)}`}>
                {p.metrics.uptime_percent.toFixed(1)}%
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-blue-600 dark:text-blue-400">
                {p.metrics.throughput_rps} rps
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-1.5 py-0 h-5 ${
                    p.score >= 90
                      ? 'border-green-400 text-green-700 dark:text-green-400'
                      : p.score >= 80
                      ? 'border-yellow-400 text-yellow-700 dark:text-yellow-400'
                      : 'border-red-400 text-red-700 dark:text-red-400'
                  }`}
                >
                  {p.score.toFixed(1)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
