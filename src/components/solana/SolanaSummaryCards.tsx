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
  highlight,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  valueColor?: string;
}) {
  return (
    <Card
      className={cn(
        'overflow-hidden shadow-sm',
        highlight && 'border-[#60a5fa]/30 bg-[#60a5fa]/5 border-l-2 border-l-[#60a5fa]'
      )}
    >
      <CardContent className="px-4 py-4 space-y-1">
        <p className="text-[10px] font-sans text-muted-foreground/70 uppercase tracking-wide">
          {label}
        </p>
        <p
          className={cn(
            'text-lg leading-none font-mono font-bold tabular-nums',
            valueColor ?? (highlight ? 'text-[#60a5fa]' : 'text-foreground')
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

function errValueColor(rate: number): string {
  if (rate < 1) return 'text-[#52c479]';
  if (rate < 5) return 'text-amber-500';
  return 'text-[#e05252]';
}

export function SolanaSummaryCards({ stats, providers }: Props) {
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

  // Median P50 latency across all providers
  const sortedByLatency = [...providers].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50);
  const medianP50 = sortedByLatency[Math.floor(sortedByLatency.length / 2)]?.metrics.latency_p50 ?? 0;

  const freeCount = providers.filter(p => p.pricing.cost_per_million === 0).length;
  const rpcCount  = providers.filter(p => p.provider_type === 'json-rpc').length;
  const restCount = providers.filter(p => p.provider_type === 'rest-api').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      <KpiCard
        label="Fastest P50"
        value={stats.fastest ? `${stats.fastest.latency_p50}ms` : '—'}
        sub={stats.fastest?.name}
        highlight
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
        label="Median P50"
        value={medianP50 ? `${medianP50}ms` : '—'}
        sub={`across ${providers.length} providers`}
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
