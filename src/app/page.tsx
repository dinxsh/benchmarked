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

const CHART_TABS: { id: ChartTab; label: string; desc: string }[] = [
  {
    id: 'latency',
    label: 'Response Time',
    desc: 'P50 = what you feel on a typical request · P95/P99 = worst-case latency (lower is better)',
  },
  {
    id: 'reliability',
    label: 'Reliability',
    desc: 'Uptime percentage across the measurement window — closer to 100% is better',
  },
  {
    id: 'throughput',
    label: 'Throughput',
    desc: 'Max requests per second — matters for high-frequency apps, bots, and indexers',
  },
  {
    id: 'overview',
    label: 'Radar View',
    desc: 'Multi-axis comparison: speed · uptime · throughput · reliability · data coverage',
  },
];

function StatCard({
  icon,
  label,
  name,
  value,
  isMock,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  isMock?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div>
        <div className="text-lg font-semibold leading-tight">
          {name}
          {isMock && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground/50">(sim)</span>
          )}
        </div>
        <div className="text-sm font-mono text-accent mt-1 tabular-nums">{value}</div>
      </div>
    </div>
  );
}

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
      const url = forceRun
        ? '/api/benchmarks/solana?run=true'
        : '/api/benchmarks/solana';
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

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const winner = data?.providers.find(p => p.rank === 1) ?? null;
  const liveCount = data?.providers.filter(p => !p.is_mock).length ?? 0;
  const totalCount = data?.providers.length ?? 0;

  const freeProviders = (data?.providers ?? []).filter(
    p => p.pricing.cost_per_million === 0
  );
  const bestFree =
    freeProviders.length > 0
      ? freeProviders.reduce((a, b) => (a.score > b.score ? a : b))
      : null;

  function handleSelectProvider(p: SolanaProvider) {
    setSelectedProvider(p);
    setSheetOpen(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-screen-xl px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight">benchmarked</span>
            <span className="hidden sm:inline text-muted-foreground/30 select-none">·</span>
            <span className="hidden sm:inline text-sm text-muted-foreground">Solana RPC</span>
          </div>

          <div className="flex items-center gap-3">
            {data && (
              <span className="hidden md:inline text-sm text-muted-foreground">
                {liveCount}/{totalCount} live
              </span>
            )}
            {lastUpdated && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {timeAgo(lastUpdated)}
              </span>
            )}
            <Badge className="gap-1.5 h-6 px-2.5 text-xs font-medium border border-accent/40 bg-accent/10 text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              LIVE
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="h-8 text-sm gap-1.5 border-border hover:border-accent/50 hover:text-accent transition-colors"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              Run Now
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-6 py-12 space-y-10">

        {/* ── Page Title ──────────────────────────────────────── */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Which Solana RPC should you use?
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Live benchmarks across {totalCount > 0 ? totalCount : 8} providers — latency,
            uptime, and throughput measured with real API calls.
          </p>
        </div>

        {/* ── Error ───────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Loading skeleton ────────────────────────────────── */}
        {loading && !data && (
          <div className="flex items-center justify-center py-28 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <span className="text-sm">Benchmarking Solana providers…</span>
          </div>
        )}

        {data && winner && (
          <>
            {/* ── Winner Card ─────────────────────────────────── */}
            <div className="relative rounded-xl border border-accent/30 bg-accent/[0.04] p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl select-none">🏆</span>
                    <h2 className="text-2xl font-bold">{winner.name}</h2>
                    <Badge className="text-xs font-semibold border border-accent/35 bg-accent/12 text-accent px-2.5">
                      #1 Overall
                    </Badge>
                    {winner.is_us && (
                      <Badge className="text-xs font-medium border border-accent/25 bg-accent/8 text-accent px-2">
                        ★ US
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs text-muted-foreground border-border/60 px-2">
                      {winner.provider_type === 'json-rpc'
                        ? 'JSON-RPC'
                        : winner.provider_type === 'rest-api'
                        ? 'REST API'
                        : 'Data API'}
                    </Badge>
                    {winner.is_mock && (
                      <Badge variant="outline" className="text-xs text-muted-foreground/50 border-muted-foreground/20 px-2">
                        simulated
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {winner.is_mock
                      ? '⚠ Simulated data — add your API key for live measurements'
                      : '✓ Live measurement from real API calls'}
                    {' · Score: latency 35% · uptime 35% · throughput 30%'}
                  </p>

                  {winner.website_url && (
                    <a
                      href={winner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-accent/80 hover:text-accent transition-colors"
                    >
                      {winner.website_url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <div className="md:text-right shrink-0">
                  <div className="text-5xl font-bold text-accent tabular-nums leading-none">
                    {winner.metrics.latency_p50}
                    <span className="text-2xl font-normal text-accent/55 ml-1">ms</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1.5">median response time (P50)</div>
                  <div className="mt-2.5">
                    <Badge variant="outline" className="text-sm font-mono tabular-nums border-accent/35 text-accent px-3 py-1">
                      Score {winner.score.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-7 pt-6 border-t border-accent/15">
                {[
                  { label: 'P95 Latency',  value: `${winner.metrics.latency_p95}ms`,                                      hint: 'worst-case for 95% of requests' },
                  { label: 'Uptime',       value: `${winner.metrics.uptime_percent.toFixed(1)}%`,                         hint: 'measured availability' },
                  { label: 'Throughput',   value: `${winner.metrics.throughput_rps} req/s`,                               hint: 'concurrent request capacity' },
                  { label: 'Pricing',      value: winner.pricing.cost_per_million === 0 ? 'Free' : `$${winner.pricing.cost_per_million}/M`, hint: winner.pricing.rate_limit },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className="text-base font-semibold tabular-nums">{s.value}</div>
                    <div className="text-xs text-muted-foreground/55 mt-0.5">{s.hint}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 4 Stat Cards ────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Fastest Response"
                name={data.providers.reduce((a, b) => a.metrics.latency_p50 < b.metrics.latency_p50 ? a : b).name}
                value={`${data.providers.reduce((a, b) => a.metrics.latency_p50 < b.metrics.latency_p50 ? a : b).metrics.latency_p50}ms P50`}
                isMock={data.providers.reduce((a, b) => a.metrics.latency_p50 < b.metrics.latency_p50 ? a : b).is_mock}
              />
              <StatCard
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="Most Reliable"
                name={data.providers.reduce((a, b) => a.metrics.uptime_percent > b.metrics.uptime_percent ? a : b).name}
                value={`${data.providers.reduce((a, b) => a.metrics.uptime_percent > b.metrics.uptime_percent ? a : b).metrics.uptime_percent.toFixed(1)}% uptime`}
                isMock={data.providers.reduce((a, b) => a.metrics.uptime_percent > b.metrics.uptime_percent ? a : b).is_mock}
              />
              <StatCard
                icon={<Gauge className="h-3.5 w-3.5" />}
                label="Highest Throughput"
                name={data.providers.reduce((a, b) => a.metrics.throughput_rps > b.metrics.throughput_rps ? a : b).name}
                value={`${data.providers.reduce((a, b) => a.metrics.throughput_rps > b.metrics.throughput_rps ? a : b).metrics.throughput_rps} req/s`}
                isMock={data.providers.reduce((a, b) => a.metrics.throughput_rps > b.metrics.throughput_rps ? a : b).is_mock}
              />
              <StatCard
                icon={<DollarSign className="h-3.5 w-3.5" />}
                label="Best Free Option"
                name={(bestFree ?? data.providers.reduce((a, b) => a.pricing.cost_per_million <= b.pricing.cost_per_million ? a : b)).name}
                value={bestFree ? `Free · Score ${bestFree.score.toFixed(0)}` : `$${data.providers.reduce((a, b) => a.pricing.cost_per_million <= b.pricing.cost_per_million ? a : b).pricing.cost_per_million}/M`}
                isMock={(bestFree ?? data.providers.reduce((a, b) => a.pricing.cost_per_million <= b.pricing.cost_per_million ? a : b)).is_mock}
              />
            </div>

            {/* ── Switchable Charts ────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-2 flex overflow-x-auto">
                {CHART_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChart(tab.id)}
                    className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 -mb-px ${
                      activeChart === tab.id
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="px-6 pt-5 pb-6">
                <p className="text-xs text-muted-foreground mb-5">
                  {CHART_TABS.find(t => t.id === activeChart)?.desc}
                </p>
                <div className="min-h-[260px]">
                  {activeChart === 'latency'     && <SolanaLatencyChart providers={data.providers} />}
                  {activeChart === 'reliability' && <SolanaUptimeIndicators providers={data.providers} />}
                  {activeChart === 'throughput'  && <SolanaThroughputChart providers={data.providers} />}
                  {activeChart === 'overview'    && <SolanaRadarChart providers={data.providers} showLegend height={360} />}
                </div>
              </div>
            </div>

            {/* ── Full Leaderboard ─────────────────────────────── */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="border-b border-border bg-card px-6 py-4">
                <h2 className="text-sm font-semibold">Full Provider Comparison</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sort by any column · click a row for detailed metrics and capabilities
                  {data.meta.errors && data.meta.errors.length > 0 && (
                    <span className="ml-2 text-chart-3">
                      · {data.meta.errors.length} provider(s) had errors
                    </span>
                  )}
                </p>
              </div>
              <SolanaLeaderboardTable
                providers={data.providers}
                onSelect={handleSelectProvider}
              />
            </div>

            {/* ── Methodology ──────────────────────────────────── */}
            <div className="text-center pb-6 space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Score = latency 35% + uptime 35% + throughput 30% · latency cap 1000ms · throughput cap 500 req/s
              </p>
              <p className="text-xs text-muted-foreground">
                JSON-RPC benchmarked via{' '}
                <code className="font-mono text-muted-foreground/60">getSlot</code>
                {' '}· REST/Data APIs via their primary endpoint · (sim) = simulated, add API key for live data
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
