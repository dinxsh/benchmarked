'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Loader2, RefreshCw, Zap, ShieldCheck, Gauge, DollarSign,
  ExternalLink, AlertCircle, BarChart2, Activity, GitCompare, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  SolanaLeaderboardTable,
  type SolanaProvider,
} from '@/components/solana/SolanaLeaderboardTable';
import { SolanaLatencyChart }        from '@/components/solana/SolanaLatencyChart';
import { SolanaThroughputChart }     from '@/components/solana/SolanaThroughputChart';
import { SolanaUptimeIndicators }    from '@/components/solana/SolanaUptimeIndicators';
import { SolanaRadarChart }          from '@/components/solana/SolanaRadarChart';
import { SolanaProviderSheet }       from '@/components/solana/SolanaProviderSheet';
import { SolanaLatencySpreadChart }  from '@/components/solana/SolanaLatencySpreadChart';
import { SolanaCostEfficiencyChart } from '@/components/solana/SolanaCostEfficiencyChart';
import { SolanaScoreBreakdownChart } from '@/components/solana/SolanaScoreBreakdownChart';
import { SolanaScoreComparison }     from '@/components/solana/SolanaScoreComparison';
import { SolanaCapabilitiesMatrix }  from '@/components/solana/SolanaCapabilitiesMatrix';

interface BenchmarkData {
  providers: SolanaProvider[];
  stats: {
    fastest: { name: string; latency_p50: number } | null;
    highest_uptime: { name: string; uptime: number } | null;
    highest_throughput: { name: string; throughput_rps: number } | null;
    winner: { name: string; score: number } | null;
    us_rank: number | null;
  };
  meta: { total_providers: number; forced_run?: boolean; errors?: string[] };
  last_updated: string;
}

// ─── Winner insights ───────────────────────────────────────────────────────────
function getWinnerInsights(winner: SolanaProvider, all: SolanaProvider[]): string[] {
  const byP50    = [...all].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50);
  const byUptime = [...all].sort((a, b) => b.metrics.uptime_percent - a.metrics.uptime_percent);
  const byRps    = [...all].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps);
  const insights: string[] = [];

  if (byP50[0]?.id === winner.id) {
    const margin = (byP50[1]?.metrics.latency_p50 ?? winner.metrics.latency_p50) - winner.metrics.latency_p50;
    insights.push(margin > 0
      ? `Lowest latency: ${winner.metrics.latency_p50}ms P50 — ${margin}ms ahead of #2`
      : `Lowest latency: ${winner.metrics.latency_p50}ms P50`
    );
  } else {
    const rank = byP50.findIndex(p => p.id === winner.id) + 1;
    insights.push(`${winner.metrics.latency_p50}ms P50 — #${rank} of ${all.length} for speed`);
  }

  if (byUptime[0]?.id === winner.id) {
    insights.push(`Best reliability: ${winner.metrics.uptime_percent.toFixed(0)}% success rate in benchmark window`);
  } else {
    insights.push(`${winner.metrics.uptime_percent.toFixed(0)}% reliability in current measurement window`);
  }

  if (winner.pricing.cost_per_million === 0) {
    insights.push('No-cost tier — best composite score among free providers');
  } else if (byRps[0]?.id === winner.id) {
    insights.push(`${winner.metrics.throughput_rps} req/s peak — highest throughput in benchmark`);
  } else {
    insights.push(`Score ${winner.score.toFixed(1)}/100 — strongest balance across all three dimensions`);
  }

  return insights;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-border bg-card h-80" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="rounded-xl border border-border bg-card h-28" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1,2,3,4].map(i => <div key={i} className="rounded-2xl border border-border bg-card h-80" />)}
      </div>
    </div>
  );
}

// ─── Hero winner ───────────────────────────────────────────────────────────────
function HeroWinnerCard({ winner, providers }: { winner: SolanaProvider; providers: SolanaProvider[] }) {
  const insights = getWinnerInsights(winner, providers);
  const jitter   = winner.metrics.latency_p99 - winner.metrics.latency_p50;

  return (
    <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-accent to-sky-500" />

      <div className="p-7 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-16">

          {/* Left */}
          <div className="space-y-6 flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="h-7 px-3 text-xs font-bold uppercase tracking-wider bg-amber-400/15 text-amber-400 border border-amber-400/30 rounded-lg">
                #1 Overall
              </Badge>
              <Badge variant="outline" className="h-7 px-3 text-xs font-semibold text-muted-foreground/70 border-border/60 rounded-lg">
                {winner.provider_type === 'json-rpc' ? 'JSON-RPC'
                  : winner.provider_type === 'rest-api' ? 'REST API' : 'Data API'}
              </Badge>
              {winner.is_mock && (
                <Badge variant="outline" className="h-7 px-3 text-xs text-amber-500/80 border-amber-500/30 rounded-lg">
                  simulated
                </Badge>
              )}
            </div>

            {/* Provider name */}
            <div>
              <h2 className="text-5xl font-extrabold tracking-tight leading-none text-foreground">
                {winner.name}
              </h2>
              {winner.website_url && (
                <a
                  href={winner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/50 hover:text-accent transition-colors mt-3"
                >
                  {winner.website_url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* Why #1 */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                Why it ranks #1
              </p>
              <ul className="space-y-3">
                {insights.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-foreground/80">
                    <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500/70 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              {winner.is_mock ? (
                <span className="text-sm text-muted-foreground/50">⚠ Simulated — add API key for live data</span>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-500/80">Live measurements · real API calls · 5 samples</span>
                </>
              )}
            </div>
          </div>

          {/* Right — giant number + score */}
          <div className="shrink-0 space-y-7 lg:min-w-[260px]">
            <div>
              <div className="flex items-end gap-2 leading-none tabular-nums">
                <span className="text-[96px] font-extrabold text-foreground tracking-tighter leading-none">
                  {winner.metrics.latency_p50}
                </span>
                <span className="text-4xl font-light text-muted-foreground/40 mb-3">ms</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50 mt-2">
                P50 Median Latency
              </p>
            </div>

            {/* Score bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground/60">Composite score</span>
                <span className="text-2xl font-extrabold font-mono tabular-nums text-foreground">
                  {winner.score.toFixed(1)}
                  <span className="text-base font-normal text-muted-foreground/40"> /100</span>
                </span>
              </div>
              <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-accent transition-all duration-1000"
                  style={{ width: `${winner.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/40 font-mono">
                <span>0</span>
                <span>latency 40% · reliability 35% · throughput 25%</span>
                <span>100</span>
              </div>
            </div>

            {/* Jitter pill */}
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/[0.04] px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">Jitter (P99−P50)</p>
                <p className="text-xs text-muted-foreground/35 mt-0.5">response consistency</p>
              </div>
              <span className={`text-xl font-extrabold font-mono tabular-nums ${
                jitter < 60 ? 'text-emerald-500' : jitter < 200 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {jitter}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border-t-2 border-border/30">
        {[
          { label: 'P95 Latency',  value: `${winner.metrics.latency_p95}ms`,               sub: '95th percentile',      color: 'text-amber-500' },
          { label: 'P99 Latency',  value: `${winner.metrics.latency_p99}ms`,               sub: 'tail latency',         color: 'text-red-400' },
          { label: 'Reliability',  value: `${winner.metrics.uptime_percent.toFixed(0)}%`,  sub: 'request success rate', color: 'text-emerald-500' },
          { label: 'Throughput',   value: `${winner.metrics.throughput_rps} rps`,          sub: 'peak concurrent',      color: 'text-sky-400' },
          { label: 'Cost / M req', value: winner.pricing.cost_per_million === 0 ? 'Free' : `$${winner.pricing.cost_per_million}`, sub: 'per million requests', color: winner.pricing.cost_per_million === 0 ? 'text-emerald-500' : 'text-foreground/70' },
        ].map((s, i) => (
          <div key={s.label} className={`px-6 py-5 bg-muted/[0.015] ${i > 0 ? 'border-l border-border/30' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">{s.label}</p>
            <p className={`text-xl font-extrabold font-mono tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground/40 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick card ────────────────────────────────────────────────────────────────
function QuickCard({ icon, badge, label, name, metric, sub, isMock }: {
  icon: React.ReactNode; badge: string; label: string;
  name: string; metric: string; sub?: string; isMock?: boolean;
}) {
  return (
    <div className="rounded-xl border-2 border-border bg-card px-5 py-5 space-y-4 hover:border-border/80 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
          <span className="text-accent">{icon}</span>
          {label}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/40 bg-muted/50 px-2 py-0.5 rounded-md shrink-0">
          {badge}
        </span>
      </div>
      <div>
        <div className="text-xl font-extrabold text-foreground leading-tight">{name}</div>
        <div className="text-lg font-bold font-mono tabular-nums text-accent mt-1.5">{metric}</div>
        {sub && <div className="text-xs text-muted-foreground/50 mt-1">{sub}</div>}
        {isMock && <div className="text-xs text-muted-foreground/35 mt-1 font-mono">simulated data</div>}
      </div>
    </div>
  );
}

// ─── KPI strip card ────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, valueColor }: {
  label: string; value: string; sub?: string; valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">{label}</p>
      <p className={`text-2xl font-extrabold font-mono tabular-nums leading-none ${valueColor ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground/50 truncate">{sub}</p>}
    </div>
  );
}

// ─── Benchmark chart card ──────────────────────────────────────────────────────
function BenchmarkCard({
  accentColor, icon, title, description,
  statLabel, statValue, statSub, statColor, children,
}: {
  accentColor: string; icon: React.ReactNode; title: string; description: string;
  statLabel?: string; statValue?: string; statSub?: string; statColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card overflow-hidden flex flex-col hover:border-border/70 transition-colors duration-200">
      <div className="h-1 shrink-0" style={{ backgroundColor: accentColor }} />
      <div className="px-6 pt-5 pb-4 border-b border-border/30 flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 text-lg font-extrabold text-foreground">
            <span style={{ color: accentColor }}>{icon}</span>
            {title}
          </div>
          <p className="text-sm text-muted-foreground/55 mt-1.5 leading-relaxed">{description}</p>
        </div>
        {statValue && (
          <div className="text-right shrink-0">
            {statLabel && <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">{statLabel}</div>}
            <div className="text-2xl font-extrabold font-mono tabular-nums" style={{ color: statColor ?? accentColor }}>
              {statValue}
            </div>
            {statSub && <div className="text-sm text-muted-foreground/50 mt-0.5 max-w-[120px] truncate">{statSub}</div>}
          </div>
        )}
      </div>
      <div className="px-6 py-6 flex-1 min-h-0">{children}</div>
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <h2 className="text-lg font-extrabold text-foreground tracking-tight">{children}</h2>
      <div className="flex-1 h-px bg-border/40" />
      {count !== undefined && (
        <span className="text-sm text-muted-foreground/50 font-mono tabular-nums">{count} providers</span>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData]         = useState<BenchmarkData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState(Date.now() + 60_000);
  const [secsLeft, setSecsLeft] = useState(60);
  const [selectedProvider, setSelectedProvider] = useState<SolanaProvider | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(async (forceRun = false) => {
    setLoading(true);
    setError(null);
    try {
      const ts  = Date.now();
      const url = `/api/benchmarks/solana?t=${ts}${forceRun ? '&run=true' : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setNextRefreshAt(Date.now() + 60_000);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch benchmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(id);
  }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => setSecsLeft(Math.max(0, Math.round((nextRefreshAt - Date.now()) / 1000))), 1_000);
    return () => clearInterval(id);
  }, [nextRefreshAt]);

  const providers  = data?.providers ?? [];
  const winner     = providers.find(p => p.rank === 1) ?? null;
  const totalCount = providers.length;
  const mockCount  = providers.filter(p => p.is_mock).length;
  const fastest    = providers.length ? providers.reduce((a, b) => a.metrics.latency_p50 < b.metrics.latency_p50 ? a : b) : null;
  const mostUptime = providers.length ? providers.reduce((a, b) => a.metrics.uptime_percent > b.metrics.uptime_percent ? a : b) : null;
  const mostRps    = providers.length ? providers.reduce((a, b) => a.metrics.throughput_rps > b.metrics.throughput_rps ? a : b) : null;
  const mostStable = providers.length ? providers.reduce((a, b) =>
    (a.metrics.latency_p99 - a.metrics.latency_p50) < (b.metrics.latency_p99 - b.metrics.latency_p50) ? a : b
  ) : null;
  const freeProviders = providers.filter(p => p.pricing.cost_per_million === 0);
  const bestFree   = freeProviders.length > 0
    ? freeProviders.reduce((a, b) => a.score > b.score ? a : b)
    : providers.length ? providers.reduce((a, b) => a.pricing.cost_per_million <= b.pricing.cost_per_million ? a : b) : null;
  const lowestErr  = providers.length ? providers.reduce((a, b) => a.metrics.error_rate < b.metrics.error_rate ? a : b) : null;
  const paid       = providers.filter(p => p.pricing.cost_per_million > 0);
  const bestValue  = paid.length > 0 ? paid.reduce((a, b) => (a.score / a.pricing.cost_per_million) > (b.score / b.pricing.cost_per_million) ? a : b) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-screen-2xl px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-extrabold tracking-tight text-foreground">Solana RPC Benchmark</span>
            <span className="hidden sm:block text-xs font-semibold text-muted-foreground/40 bg-muted/40 px-2 py-1 rounded-md">
              {totalCount > 0 ? `${totalCount} providers` : 'loading…'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="hidden lg:block text-sm text-muted-foreground/50 font-mono tabular-nums">
                next in {secsLeft}s
              </span>
            )}
            {data && mockCount > 0 && (
              <span className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-amber-500/80 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                {mockCount} simulated
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="h-9 px-4 text-sm font-semibold gap-2 border-2 hover:border-accent/50 hover:text-accent transition-all duration-200"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">Run Now</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Simulated banner ───────────────────────────────────────────────── */}
      {data && mockCount > 0 && (
        <div className="border-b border-amber-500/20 bg-amber-500/[0.05] px-5 sm:px-8 py-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-bold text-amber-500/90">
            {mockCount} of {totalCount} providers using simulated data
          </span>
          <span className="text-sm text-amber-500/60 hidden sm:inline">
            — configure API keys in .env.local for live measurements
          </span>
        </div>
      )}

      <main className="mx-auto max-w-screen-2xl px-5 sm:px-8 py-8 sm:py-10 space-y-10">

        {/* ── Title ──────────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Which Solana RPC is fastest right now?
          </h1>
          {totalCount > 0 && (
            <p className="text-base text-muted-foreground/60 mt-2">
              {totalCount} providers · 5 live samples each · refreshes every 60s · no caching
            </p>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/[0.06] px-5 py-4 text-sm text-destructive font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !data && <SkeletonState />}

        {data && winner && (
          <>
            {/* ── Zone 1: Hero ──────────────────────────────────────────────── */}
            <HeroWinnerCard winner={winner} providers={providers} />

            {/* ── Zone 2: Quick decisions ────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {fastest && (
                <QuickCard
                  icon={<Zap className="h-4 w-4" />} badge="Speed"
                  label="Lowest Latency" name={fastest.name}
                  metric={`${fastest.metrics.latency_p50}ms`} sub="P50 median" isMock={fastest.is_mock}
                />
              )}
              {mostUptime && (
                <QuickCard
                  icon={<ShieldCheck className="h-4 w-4" />} badge="Uptime"
                  label="Most Reliable" name={mostUptime.name}
                  metric={`${mostUptime.metrics.uptime_percent.toFixed(0)}%`} sub="request success" isMock={mostUptime.is_mock}
                />
              )}
              {mostRps && (
                <QuickCard
                  icon={<Gauge className="h-4 w-4" />} badge="Throughput"
                  label="Highest Throughput" name={mostRps.name}
                  metric={`${mostRps.metrics.throughput_rps} rps`} sub="peak concurrent" isMock={mostRps.is_mock}
                />
              )}
              {bestFree && (
                <QuickCard
                  icon={<DollarSign className="h-4 w-4" />} badge="Value"
                  label="Best Free / Value" name={bestFree.name}
                  metric={freeProviders.some(p => p.id === bestFree.id) ? 'Free' : `$${bestFree.pricing.cost_per_million}/M`}
                  sub={`Score ${bestFree.score.toFixed(1)}`}
                  isMock={bestFree.is_mock}
                />
              )}
            </div>

            {/* ── Zone 3: KPI strip ──────────────────────────────────────────── */}
            <div>
              <SectionHeading count={totalCount}>Key Metrics</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <KpiCard label="Fastest P50"    value={fastest ? `${fastest.metrics.latency_p50}ms` : '—'}       sub={fastest?.name} />
                <KpiCard label="Best Uptime"    value={mostUptime ? `${mostUptime.metrics.uptime_percent.toFixed(0)}%` : '—'}  sub={mostUptime?.name} />
                <KpiCard label="Peak Throughput" value={mostRps ? `${mostRps.metrics.throughput_rps}` : '—'}      sub={mostRps ? `${mostRps.name} · rps` : undefined} />
                <KpiCard label="Top Score"      value={winner ? `${winner.score.toFixed(1)}` : '—'}               sub={winner?.name} valueColor="text-amber-400" />
                <KpiCard label="Most Consistent" value={mostStable ? `${mostStable.metrics.latency_p99 - mostStable.metrics.latency_p50}ms` : '—'} sub={mostStable ? `${mostStable.name} · jitter` : undefined} valueColor="text-emerald-500" />
                <KpiCard label="Lowest Error"   value={lowestErr ? `${lowestErr.metrics.error_rate.toFixed(0)}%` : '—'} sub={lowestErr?.name} valueColor="text-emerald-500" />
                <KpiCard label="Best Value"     value={bestValue ? `${Math.round(bestValue.score / bestValue.pricing.cost_per_million)}` : '—'} sub={bestValue ? `${bestValue.name} · pts/$` : 'no paid data'} />
                <KpiCard label="Free Providers" value={`${freeProviders.length}`} sub={`of ${totalCount} total`} />
              </div>
            </div>

            {/* ── Zone 4: Analysis tabs ──────────────────────────────────────── */}
            <div>
              <SectionHeading count={totalCount}>Benchmark Analysis</SectionHeading>

              <Tabs defaultValue="performance" className="space-y-5">
                <TabsList className="h-11 bg-muted/40 border-2 border-border/40 rounded-xl p-1 gap-1">
                  {[
                    { value: 'performance', icon: <Zap className="h-4 w-4" />,        label: 'Performance' },
                    { value: 'reliability', icon: <ShieldCheck className="h-4 w-4" />, label: 'Reliability' },
                    { value: 'value',       icon: <DollarSign className="h-4 w-4" />,  label: 'Value' },
                    { value: 'overview',    icon: <GitCompare className="h-4 w-4" />,   label: 'Overview' },
                  ].map(t => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="text-sm font-semibold gap-2 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:font-bold"
                    >
                      {t.icon}{t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="performance">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <BenchmarkCard
                      accentColor="#22c55e" icon={<Zap className="h-5 w-5" />}
                      title="Latency" description="Ranked by P50 median · P95 and P99 tail extensions · Δ vs fastest annotated"
                      statLabel="Best P50" statValue={fastest ? `${fastest.metrics.latency_p50}ms` : '—'} statSub={fastest?.name} statColor="#22c55e"
                    >
                      <SolanaLatencyChart providers={providers} />
                    </BenchmarkCard>
                    <BenchmarkCard
                      accentColor="#38bdf8" icon={<Gauge className="h-5 w-5" />}
                      title="Throughput" description="Peak concurrent req/s · 10 parallel requests fired simultaneously"
                      statLabel="Peak RPS" statValue={mostRps ? `${mostRps.metrics.throughput_rps}` : '—'} statSub={mostRps?.name} statColor="#38bdf8"
                    >
                      <SolanaThroughputChart providers={providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>

                <TabsContent value="reliability">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <BenchmarkCard
                      accentColor="#22c55e" icon={<ShieldCheck className="h-5 w-5" />}
                      title="Uptime / Reliability" description="Request success rate in current benchmark window · green ≥99% · amber ≥80% · red <80%"
                      statLabel="Best Uptime" statValue={mostUptime ? `${mostUptime.metrics.uptime_percent.toFixed(0)}%` : '—'} statSub={mostUptime?.name} statColor="#22c55e"
                    >
                      <SolanaUptimeIndicators providers={providers} />
                    </BenchmarkCard>
                    <BenchmarkCard
                      accentColor="#f59e0b" icon={<Activity className="h-5 w-5" />}
                      title="Latency Spread" description="Stacked P50→P95→P99 · shows tail risk and jitter per provider"
                      statLabel="Best Jitter" statValue={mostStable ? `${mostStable.metrics.latency_p99 - mostStable.metrics.latency_p50}ms` : '—'} statSub={mostStable?.name} statColor="#f59e0b"
                    >
                      <SolanaLatencySpreadChart providers={providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>

                <TabsContent value="value">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <BenchmarkCard
                      accentColor="#a78bfa" icon={<DollarSign className="h-5 w-5" />}
                      title="Cost vs Performance" description="X = cost/M req · Y = composite score · bubble size = throughput"
                      statLabel="Best Paid Value"
                      statValue={bestValue ? `${Math.round(bestValue.score / bestValue.pricing.cost_per_million)} pts/$` : '—'}
                      statSub="score per $1/M" statColor="#a78bfa"
                    >
                      <SolanaCostEfficiencyChart providers={providers} />
                    </BenchmarkCard>
                    <BenchmarkCard
                      accentColor="#38bdf8" icon={<BarChart2 className="h-5 w-5" />}
                      title="Score Breakdown" description="Composite decomposed: latency 40% · reliability 35% · throughput 25%"
                      statLabel="Top Score" statValue={winner ? `${winner.score.toFixed(1)}` : '—'} statSub={winner?.name} statColor="#38bdf8"
                    >
                      <SolanaScoreBreakdownChart providers={providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <BenchmarkCard
                      accentColor="#a78bfa" icon={<GitCompare className="h-5 w-5" />}
                      title="Multi-Axis Radar" description="Speed · Uptime · Throughput · Reliability · Coverage — normalized to 100"
                      statLabel="Leader score" statValue={winner ? `${winner.score.toFixed(1)}` : '—'} statSub={winner?.name} statColor="#a78bfa"
                    >
                      <SolanaRadarChart providers={providers} showLegend height={340} />
                    </BenchmarkCard>
                    <BenchmarkCard
                      accentColor="#f59e0b" icon={<BarChart2 className="h-5 w-5" />}
                      title="Dimension Comparison" description="5 metrics per provider · bars relative to highest scorer in each dimension"
                      statLabel="Providers" statValue={`${totalCount}`} statSub="all types" statColor="#f59e0b"
                    >
                      <SolanaScoreComparison providers={providers} />
                    </BenchmarkCard>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* ── Zone 5: Full table ─────────────────────────────────────────── */}
            <div>
              <SectionHeading count={totalCount}>Full Provider Comparison</SectionHeading>
              <div className="rounded-2xl border-2 border-border overflow-hidden">
                <div className="border-b-2 border-border bg-card px-6 py-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Benchmark Table</h2>
                    <p className="text-sm text-muted-foreground/55 mt-1">
                      Click any column header to sort · click a row for full provider details · Jitter = P99−P50 · Value = score÷cost
                    </p>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-medium shrink-0">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing…
                    </div>
                  )}
                </div>
                <SolanaLeaderboardTable providers={providers} onSelect={p => { setSelectedProvider(p); setSheetOpen(true); }} />
              </div>
            </div>

            {/* ── Zone 6: Capabilities ──────────────────────────────────────── */}
            <div>
              <SectionHeading count={totalCount}>Feature Capabilities</SectionHeading>
              <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
                <div className="border-b-2 border-border px-6 py-5">
                  <h2 className="text-xl font-extrabold text-foreground">Capability Matrix</h2>
                  <p className="text-sm text-muted-foreground/55 mt-1">
                    Feature support, pricing tiers, rate limits, and data depth across all providers
                  </p>
                </div>
                <div className="px-6 py-5 overflow-x-auto">
                  <SolanaCapabilitiesMatrix providers={providers} />
                </div>
              </div>
            </div>

            {/* ── Footnote ──────────────────────────────────────────────────── */}
            <div className="border-t border-border/30 pt-6 pb-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground/50">
                Score = latency 40% + reliability 35% + throughput 25%
                {' · '}Jitter = P99 − P50
                {' · '}Value = score ÷ ($/M)
                {' · '}5 samples · latency cap 2000ms · throughput cap 200 rps
              </p>
              <p className="text-xs text-muted-foreground/35">
                JSON-RPC via <code className="font-mono bg-muted/50 px-1.5 py-0.5 rounded">getSlot</code>
                {' · '}REST/Data APIs via primary endpoint
                {' · '}Refreshes every 60s · no server-side caching · all live measurements
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
