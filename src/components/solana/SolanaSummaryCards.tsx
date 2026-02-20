'use client';

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
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 space-y-1 ${
        accent
          ? 'border-accent/60 bg-accent/8 border-l-2 border-l-accent'
          : 'border-border bg-muted/20'
      }`}
    >
      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-[15px] leading-none font-mono font-bold tabular-nums ${
          accent ? 'text-accent' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] leading-tight font-mono text-muted-foreground truncate">{sub}</p>
      )}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function SolanaSummaryCards({ stats, providers }: Props) {
  const usProvider = providers.find(p => p.is_us);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
        value={stats.winner ? stats.winner.score.toFixed(1) : '—'}
        sub={stats.winner?.name}
      />
      <KpiCard
        label="Our Rank"
        value={stats.us_rank !== null ? ordinal(stats.us_rank) : '—'}
        sub={usProvider ? `Score ${usProvider.score.toFixed(1)}` : undefined}
        accent
      />
    </div>
  );
}
