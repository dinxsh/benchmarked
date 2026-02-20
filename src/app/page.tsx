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
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SolanaLeaderboardTable,
  type SolanaProvider,
} from '@/components/solana/SolanaLeaderboardTable';
import { SolanaLatencyChart } from '@/components/solana/SolanaLatencyChart';
import { SolanaThroughputChart } from '@/components/solana/SolanaThroughputChart';
import { SolanaUptimeIndicators } from '@/components/solana/SolanaUptimeIndicators';
import { SolanaRadarChart } from '@/components/solana/SolanaRadarChart';
import { SolanaProviderSheet } from '@/components/solana/SolanaProviderSheet';

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

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

type ChartTab = 'latency' | 'reliability' | 'throughput' | 'overview';

const CHART_TABS: { id: ChartTab; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'latency',
    label: 'Latency',
    desc: 'Stacked P50 · P95 · P99 — the bar shows where each percentile lands. Shorter bars with less amber/red = more consistent.',
    icon: <Zap className="h-3 w-3" />,
  },
  {
    id: 'reliability',
    label: 'Uptime',
    desc: 'Measured availability across the benchmark window — ≥99.5% is excellent, ≥98% is acceptable.',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  {
    id: 'throughput',
    label: 'Throughput',
    desc: 'Peak requests per second — critical for bots, indexers, and high-frequency dApps.',
    icon: <Gauge className="h-3 w-3" />,
  },
  {
    id: 'overview',
    label: 'Radar',
    desc: 'Multi-axis snapshot: Speed · Uptime · Throughput · Reliability · Data Coverage.',
    icon: <Activity className="h-3 w-3" />,
  },
];

// ─── Skeleton loading card ───────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4 space-y-3 animate-pulse">
      <div className="h-2.5 w-24 bg-muted/60 rounded-full" />
      <div className="space-y-2">
        <div className="h-3.5 w-32 bg-muted/50 rounded-full" />
        <div className="h-3 w-20 bg-muted/40 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonWinner() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8 animate-pulse space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-3">
          <div className="h-4 w-16 bg-muted/50 rounded-full" />
          <div className="h-6 w-40 bg-muted/60 rounded-full" />
          <div className="h-3 w-64 bg-muted/40 rounded-full" />
        </div>
        <div className="space-y-2 md:text-right">
          <div className="h-10 w-24 bg-muted/50 rounded-lg" />
          <div className="h-3 w-32 bg-muted/40 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-5 pt-6 border-t border-border/40">
        {[1,2,3,4].map(i => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 w-12 bg-muted/40 rounded-full" />
            <div className="h-4 w-16 bg-muted/50 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  name,
  value,
  isMock,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  isMock?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`group rounded-lg border bg-card px-5 py-4 space-y-3 transition-all duration-200 hover:shadow-md ${
        accent
          ? 'border-accent/30 hover:border-accent/50'
          : 'border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground/70 text-[10px] font-medium uppercase tracking-widest">
          {icon}
          {label}
        </div>
        {isMock && (
          <span className="text-[9px] text-muted-foreground/35 bg-muted/30 px-1.5 py-0.5 rounded font-mono">sim</span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground leading-snug">{name}</div>
        <div className={`text-sm font-mono mt-1.5 tabular-nums font-medium ${accent ? 'text-accent' : 'text-muted-foreground/80'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Chart tab button ─────────────────────────────────────────────────────────
function ChartTabBtn({
  tab,
  active,
  onClick,
}: {
  tab: (typeof CHART_TABS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium border-b-2 transition-all duration-200 whitespace-nowrap shrink-0 -mb-px select-none ${
        active
          ? 'border-accent text-foreground'
          : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground hover:border-border/50'
      }`}
    >
      <span className={`transition-colors ${active ? 'text-accent' : 'text-muted-foreground/40'}`}>
        {tab.icon}
      </span>
      {tab.label}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  description,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
      <div className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon && <span className="text-muted-foreground/60">{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground/60">{description}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<SolanaProvider | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartTab>('latency');

  const fetchData = useCallback(async (forceRun = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRun ? '/api/benchmarks/solana?run=true' : '/api/benchmarks/solana';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(json.last_updated);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch benchmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const id = setInterval(() => { fetchData(); setTick(t => t + 1); }, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Tick every 15s just to refresh relative timestamps
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const winner     = data?.providers.find(p => p.rank === 1) ?? null;
  const liveCount  = data?.providers.filter(p => !p.is_mock).length ?? 0;
  const totalCount = data?.providers.length ?? 0;
  const mockCount  = data?.providers.filter(p => p.is_mock).length ?? 0;

  const freeProviders = (data?.providers ?? []).filter(p => p.pricing.cost_per_million === 0);
  const bestFree      = freeProviders.length > 0
    ? freeProviders.reduce((a, b) => (a.score > b.score ? a : b))
    : null;

  function handleSelectProvider(p: SolanaProvider) {
    setSelectedProvider(p);
    setSheetOpen(true);
  }

  const fastest    = data?.providers.reduce((a, b) => a.metrics.latency_p50 < b.metrics.latency_p50 ? a : b);
  const mostUptime = data?.providers.reduce((a, b) => a.metrics.uptime_percent > b.metrics.uptime_percent ? a : b);
  const mostRps    = data?.providers.reduce((a, b) => a.metrics.throughput_rps > b.metrics.throughput_rps ? a : b);
  const bestValue  = bestFree ?? data?.providers.reduce((a, b) => a.pricing.cost_per_million <= b.pricing.cost_per_million ? a : b);

  const errorCount = data?.meta.errors?.length ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-screen-xl px-6 h-14 flex items-center justify-between gap-4">

          {/* Wordmark + breadcrumb */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-tight text-foreground">benchmarked</span>
            <span className="text-border/80 select-none">/</span>
            <span className="text-sm text-muted-foreground/70">Solana RPC</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {data && liveCount < totalCount && (
              <span className="hidden md:inline text-[10px] text-muted-foreground/50 font-mono">
                {liveCount} live · {mockCount} sim
              </span>
            )}
            {data && liveCount === totalCount && (
              <span className="hidden md:inline text-[10px] text-muted-foreground/50 font-mono">
                {totalCount} providers
              </span>
            )}
            {lastUpdated && (
              <span className="hidden sm:inline text-[10px] text-muted-foreground/40 font-mono tabular-nums">
                {timeAgo(lastUpdated)}
              </span>
            )}
            <Badge className="gap-1.5 h-6 px-2.5 text-[10px] font-medium border border-accent/35 bg-accent/8 text-accent rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              LIVE
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="h-8 text-xs gap-1.5 border-border hover:border-accent/40 hover:text-accent transition-all duration-200"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              Run Now
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-6 py-10 space-y-8">

        {/* ── Page headline ──────────────────────────────────────────── */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">
            Which Solana RPC should you use?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Live benchmarks across {totalCount > 0 ? totalCount : 8} providers.
            Latency, uptime, and throughput measured with real API calls every 60 seconds.
          </p>
        </div>

        {/* ── Simulated data notice ──────────────────────────────────── */}
        {data && mockCount > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg border border-chart-3/25 bg-chart-3/[0.04] px-4 py-3 text-xs text-chart-3/80">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-chart-3/60" />
            <span>
              <span className="font-medium">{mockCount} provider{mockCount !== 1 ? 's' : ''} using simulated data</span>
              {' — '}add API keys to your <code className="font-mono text-[10px]">.env</code> for live measurements.
            </span>
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Skeleton loading ───────────────────────────────────────── */}
        {loading && !data && (
          <div className="space-y-8">
            <SkeletonWinner />
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
            <div className="rounded-xl border border-border bg-card h-[340px] animate-pulse" />
          </div>
        )}

        {data && winner && (
          <>
            {/* ── Winner card ────────────────────────────────────────── */}
            <div className="relative rounded-xl border border-accent/25 bg-card overflow-hidden">
              {/* Top accent hairline */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

              <div className="px-6 pt-6 pb-0 md:px-8 md:pt-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

                  {/* Left: identity */}
                  <div className="space-y-3">
                    {/* Rank badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="h-5 px-2 text-[9px] font-bold uppercase tracking-wider border border-accent/35 bg-accent/12 text-accent rounded">
                        #1 Provider
                      </Badge>
                      <Badge variant="outline" className="h-5 px-2 text-[9px] text-muted-foreground/60 border-border/50 rounded">
                        {winner.provider_type === 'json-rpc' ? 'JSON-RPC'
                          : winner.provider_type === 'rest-api' ? 'REST API'
                          : 'Data API'}
                      </Badge>
                      {winner.is_us && (
                        <Badge className="h-5 px-2 text-[9px] font-medium border border-accent/25 bg-accent/8 text-accent/80 rounded">
                          ★ US
                        </Badge>
                      )}
                      {winner.is_mock && (
                        <Badge variant="outline" className="h-5 px-2 text-[9px] text-muted-foreground/40 border-muted-foreground/20 rounded">
                          simulated
                        </Badge>
                      )}
                    </div>

                    {/* Provider name — the hero */}
                    <h2 className="text-2xl font-bold tracking-tight">{winner.name}</h2>

                    {/* Data quality note */}
                    <p className="text-xs text-muted-foreground/60 max-w-md">
                      {winner.is_mock
                        ? '⚠ Simulated data — add your API key for live measurements'
                        : '✓ Live measurements from real API calls'}
                      {' · '}Score = latency 35% · uptime 35% · throughput 30%
                    </p>

                    {winner.website_url && (
                      <a
                        href={winner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent/60 hover:text-accent transition-colors duration-150"
                      >
                        {winner.website_url.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {/* Right: key metrics */}
                  <div className="shrink-0 md:text-right space-y-1.5">
                    <div className="tabular-nums leading-none">
                      <span className="text-5xl font-bold text-accent">{winner.metrics.latency_p50}</span>
                      <span className="text-xl font-normal text-accent/45 ml-1.5">ms</span>
                    </div>
                    <div className="text-xs text-muted-foreground/50">P50 median latency</div>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-mono tabular-nums font-medium border border-accent/30 text-accent px-3 py-1.5 rounded-lg bg-accent/5">
                        Score {winner.score.toFixed(1)}
                        <span className="text-accent/50 text-[10px]">/ 100</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mt-6 border-t border-accent/12 bg-accent/[0.02]">
                {[
                  { label: 'P95 Latency',  value: `${winner.metrics.latency_p95}ms`,                                               hint: '95th percentile' },
                  { label: 'Uptime',        value: `${winner.metrics.uptime_percent.toFixed(2)}%`,                                   hint: 'measured availability' },
                  { label: 'Throughput',    value: `${winner.metrics.throughput_rps} req/s`,                                         hint: 'concurrent capacity' },
                  { label: 'Pricing',       value: winner.pricing.cost_per_million === 0 ? 'Free tier' : `$${winner.pricing.cost_per_million}/M`, hint: winner.pricing.rate_limit },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={`px-6 py-4 space-y-1 ${i > 0 ? 'border-l border-accent/10' : ''}`}
                  >
                    <div className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/50">{s.label}</div>
                    <div className="text-sm font-semibold font-mono tabular-nums text-foreground/90">{s.value}</div>
                    <div className="text-[9px] text-muted-foreground/40">{s.hint}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 4 Stat cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {fastest && (
                <StatCard
                  icon={<Zap className="h-3 w-3" />}
                  label="Fastest Response"
                  name={fastest.name}
                  value={`${fastest.metrics.latency_p50}ms P50`}
                  isMock={fastest.is_mock}
                  accent
                />
              )}
              {mostUptime && (
                <StatCard
                  icon={<ShieldCheck className="h-3 w-3" />}
                  label="Most Reliable"
                  name={mostUptime.name}
                  value={`${mostUptime.metrics.uptime_percent.toFixed(2)}% uptime`}
                  isMock={mostUptime.is_mock}
                />
              )}
              {mostRps && (
                <StatCard
                  icon={<Gauge className="h-3 w-3" />}
                  label="Highest Throughput"
                  name={mostRps.name}
                  value={`${mostRps.metrics.throughput_rps} req/s`}
                  isMock={mostRps.is_mock}
                />
              )}
              {bestValue && (
                <StatCard
                  icon={<DollarSign className="h-3 w-3" />}
                  label="Best Free Option"
                  name={bestValue.name}
                  value={bestFree ? `Free · Score ${bestValue.score.toFixed(0)}` : `$${bestValue.pricing.cost_per_million}/M`}
                  isMock={bestValue.is_mock}
                />
              )}
            </div>

            {/* ── Switchable charts ───────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">

              {/* Tab bar */}
              <div className="border-b border-border px-2 flex overflow-x-auto gap-0">
                {CHART_TABS.map(tab => (
                  <ChartTabBtn
                    key={tab.id}
                    tab={tab}
                    active={activeChart === tab.id}
                    onClick={() => setActiveChart(tab.id)}
                  />
                ))}
              </div>

              {/* Chart description */}
              <div className="px-6 pt-4 pb-0">
                <p className="text-[10px] text-muted-foreground/55 leading-relaxed">
                  {CHART_TABS.find(t => t.id === activeChart)?.desc}
                </p>
              </div>

              {/* Chart viewport */}
              <div className="px-6 pt-4 pb-6">
                {activeChart === 'latency'     && <SolanaLatencyChart     providers={data.providers} />}
                {activeChart === 'reliability' && <SolanaUptimeIndicators providers={data.providers} />}
                {activeChart === 'throughput'  && <SolanaThroughputChart  providers={data.providers} />}
                {activeChart === 'overview'    && <SolanaRadarChart       providers={data.providers} showLegend height={360} />}
              </div>
            </div>

            {/* ── Full leaderboard ────────────────────────────────────── */}
            <div className="rounded-xl border border-border overflow-hidden">
              <SectionHeader
                icon={<BarChart2 className="h-3.5 w-3.5" />}
                title="Full Provider Comparison"
                description={
                  `Sort any column · click a row for detailed metrics${
                    errorCount > 0 ? ` · ${errorCount} provider${errorCount !== 1 ? 's' : ''} had errors this run` : ''
                  }`
                }
                right={
                  <span className="text-[10px] font-mono text-muted-foreground/40 tabular-nums">
                    {data.providers.length} providers
                  </span>
                }
              />
              <SolanaLeaderboardTable
                providers={data.providers}
                onSelect={handleSelectProvider}
              />
            </div>

            {/* ── Methodology footnote ─────────────────────────────────── */}
            <div className="border-t border-border/30 pt-6 pb-4 space-y-1.5 text-center">
              <p className="text-[10px] text-muted-foreground/40">
                Score = latency 35% + uptime 35% + throughput 30%
                {' · '}latency cap 1000ms · throughput cap 500 req/s
              </p>
              <p className="text-[10px] text-muted-foreground/35">
                JSON-RPC benchmarked via{' '}
                <code className="font-mono">getSlot</code>
                {' · '}REST/Data APIs via their primary endpoint
                {' · '}(sim) = simulated, add API key for live data
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
