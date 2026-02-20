'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Loader2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Gauge,
  DollarSign,
  ExternalLink,
  AlertCircle,
  BarChart2,
  Radar,
  TrendingDown,
  Activity,
  GitCompare,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  SolanaLeaderboardTable,
  type SolanaProvider,
} from '@/components/solana/SolanaLeaderboardTable';
import { SolanaLatencyChart }       from '@/components/solana/SolanaLatencyChart';
import { SolanaThroughputChart }    from '@/components/solana/SolanaThroughputChart';
import { SolanaUptimeIndicators }   from '@/components/solana/SolanaUptimeIndicators';
import { SolanaRadarChart }         from '@/components/solana/SolanaRadarChart';
import { SolanaProviderSheet }      from '@/components/solana/SolanaProviderSheet';
import { SolanaLatencySpreadChart } from '@/components/solana/SolanaLatencySpreadChart';
import { SolanaCostEfficiencyChart } from '@/components/solana/SolanaCostEfficiencyChart';
import { SolanaScoreBreakdownChart } from '@/components/solana/SolanaScoreBreakdownChart';
import { SolanaScoreComparison }    from '@/components/solana/SolanaScoreComparison';
import { SolanaCapabilitiesMatrix } from '@/components/solana/SolanaCapabilitiesMatrix';
import { SolanaSummaryCards }       from '@/components/solana/SolanaSummaryCards';

interface BenchmarkData {
  providers: SolanaProvider[];
  stats: {
    fastest: { name: string; latency_p50: number } | null;
    highest_uptime: { name: string; uptime: number } | null;
    highest_throughput: { name: string; throughput_rps: number } | null;
    winner: { name: string; score: number } | null;
    us_rank: number | null;
  };
  meta: {
    total_providers: number;
    forced_run?: boolean;
    errors?: string[];
  };
  last_updated: string;
}

// ─── Winner insight generator ──────────────────────────────────────────────────
function getWinnerInsights(winner: SolanaProvider, all: SolanaProvider[]): string[] {
  const byP50    = [...all].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50);
  const byUptime = [...all].sort((a, b) => b.metrics.uptime_percent - a.metrics.uptime_percent);
  const byRps    = [...all].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps);
  const insights: string[] = [];

  if (byP50[0]?.id === winner.id) {
    const second = byP50[1]?.metrics.latency_p50 ?? winner.metrics.latency_p50;
    const margin = second - winner.metrics.latency_p50;
    insights.push(
      margin > 0
        ? `Lowest latency: ${winner.metrics.latency_p50}ms P50 — ${margin}ms ahead of next provider`
        : `Lowest latency: ${winner.metrics.latency_p50}ms P50`
    );
  } else {
    const rank = byP50.findIndex(p => p.id === winner.id) + 1;
    insights.push(`${winner.metrics.latency_p50}ms P50 median — #${rank} of ${all.length} for speed`);
  }

  if (byUptime[0]?.id === winner.id) {
    insights.push(`Highest availability: ${winner.metrics.uptime_percent.toFixed(2)}% measured uptime`);
  } else if (winner.metrics.uptime_percent >= 99.9) {
    insights.push(`${winner.metrics.uptime_percent.toFixed(2)}% uptime — enterprise-grade reliability`);
  } else {
    insights.push(`${winner.metrics.uptime_percent.toFixed(2)}% measured availability`);
  }

  if (winner.pricing.cost_per_million === 0) {
    insights.push('Free tier — highest composite score among no-cost providers');
  } else if (byRps[0]?.id === winner.id) {
    insights.push(`${winner.metrics.throughput_rps} req/s peak — highest throughput in benchmark`);
  } else {
    insights.push(`Score ${winner.score.toFixed(1)}/100 — strongest balance of latency, uptime & throughput`);
  }

  return insights;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-border bg-card h-72" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="rounded-lg border border-border bg-card h-24" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="rounded-lg border border-border bg-card h-16" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="rounded-xl border border-border bg-card h-80" />)}
      </div>
    </div>
  );
}

// ─── Hero winner card ──────────────────────────────────────────────────────────
function HeroWinnerCard({ winner, providers }: { winner: SolanaProvider; providers: SolanaProvider[] }) {
  const insights = getWinnerInsights(winner, providers);
  const jitter   = winner.metrics.latency_p99 - winner.metrics.latency_p50;

  return (
    <div className="relative rounded-xl border border-accent/20 bg-card overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />

      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-14">

          {/* Left: identity + why */}
          <div className="space-y-5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider border border-accent/35 bg-accent/10 text-accent rounded">
                #1 Overall
              </Badge>
              <Badge variant="outline" className="h-6 px-2.5 text-[10px] text-muted-foreground/65 border-border/50 rounded">
                {winner.provider_type === 'json-rpc' ? 'JSON-RPC'
                  : winner.provider_type === 'rest-api' ? 'REST API' : 'Data API'}
              </Badge>
              {winner.is_us && (
                <Badge className="h-6 px-2.5 text-[10px] font-medium border border-accent/25 bg-accent/8 text-accent/80 rounded">
                  ★ US
                </Badge>
              )}
              {winner.is_mock && (
                <Badge variant="outline" className="h-6 px-2.5 text-[10px] text-chart-3/80 border-chart-3/30 rounded">
                  simulated
                </Badge>
              )}
            </div>

            <div>
              <h2 className="text-[36px] font-bold tracking-tight leading-none">{winner.name}</h2>
              {winner.website_url && (
                <a
                  href={winner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground/55 hover:text-accent transition-colors duration-150 mt-2"
                >
                  {winner.website_url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/55 font-semibold">
                Why it&apos;s #1
              </p>
              <ul className="space-y-2.5">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-snug">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent/60 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {winner.is_mock ? (
                <span className="text-sm text-muted-foreground/50">⚠ Simulated — add API key for live data</span>
              ) : (
                <span className="flex items-center gap-2 text-sm text-chart-2/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-chart-2 animate-pulse" />
                  Live measurements · real API calls
                </span>
              )}
            </div>
          </div>

          {/* Right: metrics panel */}
          <div className="shrink-0 space-y-6 lg:min-w-[260px]">
            <div>
              <div className="tabular-nums leading-none">
                <span className="text-[80px] font-bold text-accent tracking-tight">
                  {winner.metrics.latency_p50}
                </span>
                <span className="text-4xl font-light text-accent/35 ml-2">ms</span>
              </div>
              <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mt-2">
                P50 Median Latency
              </p>
            </div>

            {/* Score bar */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground/65">Composite score</span>
                <span className="text-base font-bold font-mono tabular-nums">
                  {winner.score.toFixed(1)}
                  <span className="text-muted-foreground/45 font-normal text-sm"> / 100</span>
                </span>
              </div>
              <div className="h-2.5 bg-muted/35 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${winner.score}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/45">
                <span>0</span>
                <span>latency 35% · uptime 35% · throughput 30%</span>
                <span>100</span>
              </div>
            </div>

            {/* Jitter indicator */}
            <div className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/[0.03] px-3 py-2.5">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/50 font-semibold">Jitter (P99−P50)</p>
                <p className="text-xs text-muted-foreground/40 mt-0.5">Consistency indicator</p>
              </div>
              <span className={`text-base font-bold font-mono tabular-nums ${
                jitter < 50 ? 'text-chart-2' : jitter < 150 ? 'text-chart-3' : 'text-destructive'
              }`}>
                {jitter}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom metrics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-accent/10">
        {[
          { label: 'P95 Latency',  value: `${winner.metrics.latency_p95}ms`,                sub: '95th percentile',     color: 'text-chart-3' },
          { label: 'P99 Latency',  value: `${winner.metrics.latency_p99}ms`,                sub: 'tail latency',        color: 'text-destructive/80' },
          { label: 'Uptime',       value: `${winner.metrics.uptime_percent.toFixed(2)}%`,   sub: 'measured avail.',     color: 'text-chart-2' },
          { label: 'Throughput',   value: `${winner.metrics.throughput_rps} req/s`,         sub: 'peak concurrent',     color: 'text-foreground/80' },
          { label: 'Cost / M req', value: winner.pricing.cost_per_million === 0 ? 'Free' : `$${winner.pricing.cost_per_million}`, sub: 'per million requests', color: winner.pricing.cost_per_million === 0 ? 'text-chart-2' : 'text-foreground/70' },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-4 space-y-1.5 bg-muted/[0.015] ${i > 0 ? 'border-l border-accent/8' : ''}`}
          >
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">{s.label}</div>
            <div className={`text-base font-bold font-mono tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground/45">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick decision card ───────────────────────────────────────────────────────
function QuickCard({
  icon, badge, label, name, metric, isMock,
}: {
  icon: React.ReactNode; badge: string; label: string;
  name: string; metric: string; isMock?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-4 space-y-3 hover:border-border/60 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">
          <span className="text-accent/65">{icon}</span>
          {label}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/45 bg-muted/40 px-1.5 py-0.5 rounded-sm">
          {badge}
        </span>
      </div>
      <div>
        <div className="text-base font-bold text-foreground leading-snug">{name}</div>
        <div className="text-sm font-mono tabular-nums text-accent mt-1 font-semibold">{metric}</div>
        {isMock && <div className="text-[10px] text-muted-foreground/40 mt-0.5">simulated data</div>}
      </div>
    </div>
  );
}

// ─── Benchmark kanban card ─────────────────────────────────────────────────────
function BenchmarkCard({
  accentColor, icon, title, description,
  statLabel, statValue, statSub, statColor, children,
}: {
  accentColor: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  statLabel?: string;
  statValue?: string;
  statSub?: string;
  statColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:border-border/70 transition-colors duration-200">
      <div className="h-[3px] shrink-0" style={{ backgroundColor: accentColor }} />
      <div className="px-5 pt-4 pb-4 border-b border-border/30 flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-bold text-foreground">
            <span style={{ color: accentColor }}>{icon}</span>
            {title}
          </div>
          <p className="text-xs text-muted-foreground/55 mt-1 leading-relaxed">{description}</p>
        </div>
        {statValue && (
          <div className="text-right shrink-0">
            {statLabel && (
              <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide mb-0.5">{statLabel}</div>
            )}
            <div className="text-xl font-bold font-mono tabular-nums" style={{ color: statColor ?? accentColor }}>
              {statValue}
            </div>
            {statSub && (
              <div className="text-xs text-muted-foreground/50 mt-0.5 max-w-[110px] truncate">{statSub}</div>
            )}
          </div>
        )}
      </div>
      <div className="px-5 py-5 flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/55">
        {children}
      </h2>
      <div className="flex-1 h-px bg-border/30" />
      {count !== undefined && (
        <span className="text-xs text-muted-foreground/45 font-mono">{count} providers</span>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState(Date.now() + 30_000);
  const [secsLeft, setSecsLeft] = useState(30);
  const [selectedProvider, setSelectedProvider] = useState<SolanaProvider | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(async (forceRun = false) => {
    setLoading(true);
    setError(null);
    try {
      const ts = Date.now();
      const url = `/api/benchmarks/solana?t=${ts}${forceRun ? '&run=true' : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setNextRefreshAt(Date.now() + 30_000);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch benchmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => fetchData(), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => {
      setSecsLeft(Math.max(0, Math.round((nextRefreshAt - Date.now()) / 1000)));
    }, 1_000);
    return () => clearInterval(id);
  }, [nextRefreshAt]);

  const winner     = data?.providers.find(p => p.rank === 1) ?? null;
  const totalCount = data?.providers.length ?? 0;
  const mockCount  = data?.providers.filter(p => p.is_mock).length ?? 0;
  const liveCount  = data?.providers.filter(p => !p.is_mock).length ?? 0;

  const fastest    = data?.providers.reduce((a, b) => a.metrics.latency_p50 < b.metrics.latency_p50 ? a : b);
  const mostUptime = data?.providers.reduce((a, b) => a.metrics.uptime_percent > b.metrics.uptime_percent ? a : b);
  const mostRps    = data?.providers.reduce((a, b) => a.metrics.throughput_rps > b.metrics.throughput_rps ? a : b);
  const mostStable = data?.providers.reduce((a, b) =>
    (a.metrics.latency_p99 - a.metrics.latency_p50) < (b.metrics.latency_p99 - b.metrics.latency_p50) ? a : b
  );

  const freeProviders = (data?.providers ?? []).filter(p => p.pricing.cost_per_million === 0);
  const bestFree = freeProviders.length > 0
    ? freeProviders.reduce((a, b) => a.score > b.score ? a : b)
    : data?.providers.reduce((a, b) => a.pricing.cost_per_million <= b.pricing.cost_per_million ? a : b);

  const errorCount = data?.meta.errors?.length ?? 0;

  function handleSelectProvider(p: SolanaProvider) {
    setSelectedProvider(p);
    setSheetOpen(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-tight text-foreground">benchmarked</span>
            <span className="text-border/80 select-none hidden sm:inline">/</span>
            <span className="text-sm text-muted-foreground/70 hidden sm:inline">Solana RPC</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {data && (
              <span className="hidden lg:block text-xs text-muted-foreground/45 font-mono tabular-nums">
                next in {secsLeft}s
              </span>
            )}
            {data && mockCount > 0 && (
              <span className="hidden md:block text-xs text-chart-3/65 font-mono font-medium">
                {mockCount} sim
              </span>
            )}
            <Badge className="gap-1.5 h-6 px-2.5 text-[10px] font-bold border border-accent/35 bg-accent/8 text-accent rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="hidden sm:inline">LIVE</span>
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="h-8 text-xs font-semibold gap-1.5 border-border hover:border-accent/40 hover:text-accent transition-all duration-200"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Run Now</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Simulated data banner ───────────────────────────────────────────── */}
      {data && mockCount > 0 && (
        <div className="border-b border-chart-3/20 bg-chart-3/[0.06] px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-chart-3 shrink-0" />
          <span className="text-sm font-semibold text-chart-3/90">
            {mockCount} of {totalCount} providers using simulated data
          </span>
          <span className="text-sm text-chart-3/60 hidden sm:inline">
            — add API keys to .env for live measurements
          </span>
        </div>
      )}

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* ── Page intro ─────────────────────────────────────────────────────── */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Which Solana RPC should you use?
          </h1>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground/60">
              {totalCount} providers · live · refreshes every 30s
              {liveCount < totalCount && ` · ${liveCount} live`}
            </span>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !data && <SkeletonState />}

        {data && winner && (
          <>
            {/* ── Zone 1: Hero ──────────────────────────────────────────────── */}
            <HeroWinnerCard winner={winner} providers={data.providers} />

            {/* ── Zone 2: Quick decision cards ──────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {fastest && (
                <QuickCard
                  icon={<Zap className="h-3.5 w-3.5" />} badge="Fastest"
                  label="Fastest" name={fastest.name}
                  metric={`${fastest.metrics.latency_p50}ms P50`} isMock={fastest.is_mock}
                />
              )}
              {mostUptime && (
                <QuickCard
                  icon={<ShieldCheck className="h-3.5 w-3.5" />} badge="Reliable"
                  label="Most Reliable" name={mostUptime.name}
                  metric={`${mostUptime.metrics.uptime_percent.toFixed(2)}% uptime`} isMock={mostUptime.is_mock}
                />
              )}
              {mostRps && (
                <QuickCard
                  icon={<Gauge className="h-3.5 w-3.5" />} badge="Throughput"
                  label="Highest Throughput" name={mostRps.name}
                  metric={`${mostRps.metrics.throughput_rps} req/s`} isMock={mostRps.is_mock}
                />
              )}
              {bestFree && (
                <QuickCard
                  icon={<DollarSign className="h-3.5 w-3.5" />} badge="Best Free"
                  label="Best Free Tier" name={bestFree.name}
                  metric={
                    freeProviders.some(p => p.id === bestFree.id)
                      ? `Free · Score ${bestFree.score.toFixed(0)}`
                      : `$${bestFree.pricing.cost_per_million}/M`
                  }
                  isMock={bestFree.is_mock}
                />
              )}
            </div>

            {/* ── Zone 3: KPI Summary Strip ─────────────────────────────────── */}
            <div>
              <SectionHeading count={data.providers.length}>Key Metrics</SectionHeading>
              <SolanaSummaryCards stats={data.stats} providers={data.providers} />
            </div>

            {/* ── Zone 4: Benchmark Analysis — tabbed ───────────────────────── */}
            <div>
              <SectionHeading count={data.providers.length}>Benchmark Analysis</SectionHeading>

              <Tabs defaultValue="performance" className="space-y-4">
                <TabsList className="h-9 bg-muted/40 border border-border/40 rounded-lg p-1">
                  <TabsTrigger value="performance" className="text-xs gap-1.5 data-[state=active]:bg-card">
                    <Zap className="h-3.5 w-3.5" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="reliability" className="text-xs gap-1.5 data-[state=active]:bg-card">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Reliability
                  </TabsTrigger>
                  <TabsTrigger value="value" className="text-xs gap-1.5 data-[state=active]:bg-card">
                    <DollarSign className="h-3.5 w-3.5" />
                    Value
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-card">
                    <Radar className="h-3.5 w-3.5" />
                    Overview
                  </TabsTrigger>
                </TabsList>

                {/* Performance tab */}
                <TabsContent value="performance" className="space-y-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BenchmarkCard
                      accentColor="var(--color-accent)"
                      icon={<Zap className="h-4 w-4" />}
                      title="Latency"
                      description="Ranked by P50 · P95/P99 extensions · Δ vs fastest annotated"
                      statLabel="Fastest P50"
                      statValue={fastest ? `${fastest.metrics.latency_p50}ms` : '—'}
                      statSub={fastest?.name}
                      statColor="var(--color-accent)"
                    >
                      <SolanaLatencyChart providers={data.providers} />
                    </BenchmarkCard>

                    <BenchmarkCard
                      accentColor="var(--color-accent)"
                      icon={<Gauge className="h-4 w-4" />}
                      title="Throughput"
                      description="Peak req/s sorted descending · multiplier vs median annotated"
                      statLabel="Peak RPS"
                      statValue={mostRps ? `${mostRps.metrics.throughput_rps}` : '—'}
                      statSub={mostRps ? `${mostRps.name} · rps` : undefined}
                      statColor="var(--color-accent)"
                    >
                      <SolanaThroughputChart providers={data.providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>

                {/* Reliability tab */}
                <TabsContent value="reliability" className="space-y-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BenchmarkCard
                      accentColor="var(--color-chart-2)"
                      icon={<ShieldCheck className="h-4 w-4" />}
                      title="Uptime"
                      description="Availability sorted descending · Green ≥99.9% · Amber <99.9% · Red <98%"
                      statLabel="Best Uptime"
                      statValue={mostUptime ? `${mostUptime.metrics.uptime_percent.toFixed(2)}%` : '—'}
                      statSub={mostUptime?.name}
                      statColor="var(--color-chart-2)"
                    >
                      <SolanaUptimeIndicators providers={data.providers} />
                    </BenchmarkCard>

                    <BenchmarkCard
                      accentColor="var(--color-chart-4)"
                      icon={<Activity className="h-4 w-4" />}
                      title="Latency Spread"
                      description="Stacked P50 → P95 → P99 · shows tail risk and jitter per provider"
                      statLabel="Most Stable"
                      statValue={mostStable ? `${mostStable.metrics.latency_p99 - mostStable.metrics.latency_p50}ms` : '—'}
                      statSub={mostStable ? `${mostStable.name} · jitter` : undefined}
                      statColor="var(--color-chart-4)"
                    >
                      <SolanaLatencySpreadChart providers={data.providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>

                {/* Value tab */}
                <TabsContent value="value" className="space-y-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BenchmarkCard
                      accentColor="var(--color-chart-5)"
                      icon={<DollarSign className="h-4 w-4" />}
                      title="Cost vs Performance"
                      description="X = cost/M req · Y = composite score · bubble size = throughput"
                      statLabel="Best Paid Value"
                      statValue={(() => {
                        const paid = data.providers.filter(p => p.pricing.cost_per_million > 0);
                        if (!paid.length) return '—';
                        const best = paid.reduce((a, b) =>
                          (a.score / a.pricing.cost_per_million) > (b.score / b.pricing.cost_per_million) ? a : b
                        );
                        return `${Math.round(best.score / best.pricing.cost_per_million)} pts/$`;
                      })()}
                      statSub="score per $1/M"
                      statColor="var(--color-chart-5)"
                    >
                      <SolanaCostEfficiencyChart providers={data.providers} />
                    </BenchmarkCard>

                    <BenchmarkCard
                      accentColor="var(--color-chart-1)"
                      icon={<BarChart2 className="h-4 w-4" />}
                      title="Score Breakdown"
                      description="Composite score decomposed: latency 35% · uptime 35% · throughput 30%"
                      statLabel="Top Score"
                      statValue={winner ? `${winner.score.toFixed(1)}` : '—'}
                      statSub={winner?.name}
                      statColor="var(--color-chart-1)"
                    >
                      <SolanaScoreBreakdownChart providers={data.providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>

                {/* Overview tab */}
                <TabsContent value="overview" className="space-y-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <BenchmarkCard
                      accentColor="var(--color-chart-5)"
                      icon={<Radar className="h-4 w-4" />}
                      title="Multi-Axis Radar"
                      description="Speed · Uptime · Throughput · Reliability · Coverage — normalized to 100"
                      statLabel="Leader score"
                      statValue={winner ? `${winner.score.toFixed(1)}` : '—'}
                      statSub={winner?.name}
                      statColor="var(--color-chart-5)"
                    >
                      <SolanaRadarChart providers={data.providers} showLegend height={320} />
                    </BenchmarkCard>

                    <BenchmarkCard
                      accentColor="var(--color-chart-3)"
                      icon={<GitCompare className="h-4 w-4" />}
                      title="Dimension Comparison"
                      description="5 metrics per provider: Speed · Uptime · Throughput · Reliability · Coverage"
                      statLabel="Providers"
                      statValue={`${data.providers.length}`}
                      statSub="all types"
                      statColor="var(--color-chart-3)"
                    >
                      <SolanaScoreComparison providers={data.providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* ── Zone 5: Provider Comparison Table ─────────────────────────── */}
            <div>
              <SectionHeading count={data.providers.length}>Provider Comparison</SectionHeading>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="border-b border-border bg-card px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                      <BarChart2 className="h-4 w-4 text-muted-foreground/55" />
                      Full Benchmark Table
                    </h2>
                    <p className="text-sm text-muted-foreground/55">
                      Sort any column · Jitter = P99−P50 · Value = score÷cost · click row for details
                      {errorCount > 0 && ` · ${errorCount} provider${errorCount !== 1 ? 's' : ''} had errors`}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground/45 tabular-nums shrink-0">
                    {data.providers.length} providers
                  </span>
                </div>
                <SolanaLeaderboardTable
                  providers={data.providers}
                  onSelect={handleSelectProvider}
                />
              </div>
            </div>

            {/* ── Zone 6: Capabilities Matrix ───────────────────────────────── */}
            <div>
              <SectionHeading count={data.providers.length}>Feature Capabilities</SectionHeading>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                      <LayoutGrid className="h-4 w-4 text-muted-foreground/55" />
                      Capability Matrix
                    </h2>
                    <p className="text-sm text-muted-foreground/55">
                      Feature support, pricing, rate limits, and data depth across all providers
                    </p>
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-4 overflow-x-auto">
                  <SolanaCapabilitiesMatrix providers={data.providers} />
                </div>
              </div>
            </div>

            {/* ── Footnote ──────────────────────────────────────────────────── */}
            <div className="border-t border-border/20 pt-5 pb-4 space-y-1.5 text-center">
              <p className="text-xs text-muted-foreground/45">
                Score = latency 35% + uptime 35% + throughput 30%
                {' · '}Jitter = P99 − P50
                {' · '}Value = score ÷ ($/M) · latency cap 1000ms · throughput cap 500 req/s
              </p>
              <p className="text-xs text-muted-foreground/35">
                JSON-RPC via <code className="font-mono">getSlot</code>
                {' · '}REST/Data APIs via primary endpoint
                {' · '}(sim) = simulated · add API key for live
              </p>
            </div>
          </>
        )}
      </main>

      <SolanaProviderSheet
        provider={selectedProvider}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
