'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Stats {
  fastest: { name: string; latency_p50: number } | null;
  highest_uptime: { name: string; uptime: number } | null;
  highest_throughput: { name: string; throughput_rps: number } | null;
  winner: { name: string; score: number } | null;
  us_rank: number | null;
}

interface Props {
  stats: Stats;
  providers: SolanaProvider[];
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  valueColor?: string;
}) {
  return (
    <Card
      className={cn(
        'overflow-hidden shadow-sm',
        accent && 'border-accent/40 bg-accent/5 border-l-2 border-l-accent'
      )}
    >
      <CardContent className="px-4 py-4 space-y-1">
        <p className="text-[10px] font-sans text-muted-foreground/70">
          {label}
        </p>
        <p
          className={cn(
            'text-lg leading-none font-mono font-bold tabular-nums',
            valueColor ?? (accent ? 'text-accent' : 'text-foreground')
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[10px] leading-tight font-sans text-muted-foreground/60 truncate">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function SolanaSummaryCards({ stats, providers }: Props) {
  const usProvider = providers.find(p => p.is_us);

  // Computed from providers
  const lowestErr = providers.length > 0
    ? [...providers].reduce((best, p) => p.metrics.error_rate < best.metrics.error_rate ? p : best, providers[0])
    : null;

  const paid = providers.filter(p => p.pricing.cost_per_million > 0);
  const bestValue = paid.length > 0
    ? paid.reduce((best, p) =>
        (p.score / p.pricing.cost_per_million) > (best.score / best.pricing.cost_per_million) ? p : best,
        paid[0]
      )
    : null;

  const freeCount = providers.filter(p => p.pricing.cost_per_million === 0).length;
  const rpcCount = providers.filter(p => p.provider_type === 'json-rpc').length;
  const restCount = providers.filter(p => p.provider_type === 'rest-api').length;

  function errValueColor(rate: number): string {
    if (rate < 1) return 'text-chart-5';
    if (rate < 5) return 'text-chart-3';
    return 'text-destructive';
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      <KpiCard
        label="Fastest Latency"
        value={stats.fastest ? `${stats.fastest.latency_p50}ms` : '—'}
        sub={stats.fastest?.name}
      />
      <KpiCard
        label="Best Uptime"
        value={stats.highest_uptime ? `${stats.highest_uptime.uptime.toFixed(2)}%` : '—'}
        sub={stats.highest_uptime?.name}
      />
      <KpiCard
        label="Best Throughput"
        value={stats.highest_throughput ? `${stats.highest_throughput.throughput_rps} rps` : '—'}
        sub={stats.highest_throughput?.name}
      />
      <KpiCard
        label="Overall Winner"
        value={stats.winner ? `${stats.winner.score.toFixed(1)} pts` : '—'}
        sub={stats.winner?.name}
      />
      <KpiCard
        label="Our Rank"
        value={stats.us_rank !== null ? ordinal(stats.us_rank) : '—'}
        sub={usProvider ? `Score ${usProvider.score.toFixed(1)}` : undefined}
        accent
      />
      <KpiCard
        label="Lowest Error Rate"
        value={lowestErr ? `${lowestErr.metrics.error_rate.toFixed(2)}%` : '—'}
        sub={lowestErr?.name}
        valueColor={lowestErr ? errValueColor(lowestErr.metrics.error_rate) : undefined}
      />
      <KpiCard
        label="Best Value"
        value={bestValue ? `${Math.round(bestValue.score / bestValue.pricing.cost_per_million)} pts/$` : '—'}
        sub={bestValue ? `${bestValue.name} · $${bestValue.pricing.cost_per_million}/M` : undefined}
      />
      <KpiCard
        label="Free Providers"
        value={`${freeCount} of ${providers.length}`}
        sub={`${restCount} REST · ${rpcCount} RPC`}
      />
    </div>
  );
}
