'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  SolanaLeaderboardTable,
  type SolanaProvider,
} from '@/components/solana/SolanaLeaderboardTable';
import { SolanaLatencyChart } from '@/components/solana/SolanaLatencyChart';
import { SolanaThroughputChart } from '@/components/solana/SolanaThroughputChart';
import { SolanaUptimeIndicators } from '@/components/solana/SolanaUptimeIndicators';
import { SolanaSummaryCards } from '@/components/solana/SolanaSummaryCards';
import { SolanaRadarChart } from '@/components/solana/SolanaRadarChart';
import { SolanaScatterChart } from '@/components/solana/SolanaScatterChart';
import { SolanaCapabilitiesMatrix } from '@/components/solana/SolanaCapabilitiesMatrix';
import { SolanaProviderSheet } from '@/components/solana/SolanaProviderSheet';
import { SolanaScoreBreakdownChart } from '@/components/solana/SolanaScoreBreakdownChart';
import { SolanaLatencySpreadChart } from '@/components/solana/SolanaLatencySpreadChart';
import { SolanaCostEfficiencyChart } from '@/components/solana/SolanaCostEfficiencyChart';
import { SolanaErrorRateChart } from '@/components/solana/SolanaErrorRateChart';
import { SolanaSlotSyncChart } from '@/components/solana/SolanaSlotSyncChart';
import { SolanaRateLimitChart } from '@/components/solana/SolanaRateLimitChart';

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

function DashSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-sans font-medium text-muted-foreground/50 uppercase tracking-wide">
          {title}
        </span>
        <div className="flex-1 h-px bg-border/30" />
      </div>
      {children}
    </section>
  );
}

function ChartCard({
  title,
  description,
  children,
  contentClass,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  contentClass?: string;
}) {
  return (
    <Card className="overflow-hidden shadow-sm h-full">
      <CardHeader className="px-4 py-3 border-b border-border/40 bg-muted/10 space-y-0.5">
        <CardTitle className="text-sm font-sans font-medium text-foreground">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs font-sans text-muted-foreground/70">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={contentClass ?? 'px-4 pb-4 pt-3'}>
        {children}
      </CardContent>
    </Card>
  );
}

export default function SolanaBenchmarksPage() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<SolanaProvider | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  function handleSelectProvider(p: SolanaProvider) {
    setSelectedProvider(p);
    setSheetOpen(true);
  }

  const liveCount = data?.providers.filter(p => !p.is_mock).length ?? 0;
  const totalCount = data?.providers.length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-5 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-sans font-semibold text-foreground">
              Solana Provider Benchmarks
            </h1>
            <Badge className="gap-1 h-5 px-1.5 text-[9px] font-sans uppercase border border-accent/60 bg-accent/10 text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Live
            </Badge>
            {data && (
              <span className="text-xs font-sans text-muted-foreground/60">
                {liveCount}/{totalCount} live
              </span>
            )}
          </div>
          <p className="text-xs font-sans text-muted-foreground/70">
            {totalCount > 0
              ? `${totalCount} providers · latency · uptime · throughput · capabilities`
              : 'LaserTeam · Alchemy · Helius · Ankr · QuickNode · GoldRush · Birdeye · Mobula'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs font-sans text-muted-foreground/60">
              {timeAgo(lastUpdated)}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={loading}
            className="h-7 text-xs font-sans gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Run Now
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-sans text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-xs font-sans">
          <Loader2 className="h-4 w-4 animate-spin" />
          Running benchmarks across 8 Solana providers…
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <SolanaSummaryCards stats={data.stats} providers={data.providers} />

          {/* Leaderboard */}
          <DashSection id="leaderboard" title="Leaderboard">
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="px-4 py-3 border-b border-border/40 bg-muted/10 space-y-0.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-sans font-medium text-foreground">Rankings</CardTitle>
                  {data.meta.errors && data.meta.errors.length > 0 && (
                    <span className="text-[10px] font-sans text-chart-3/80">
                      {data.meta.errors.length} error(s)
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs font-sans text-muted-foreground/70">
                  Click any row for full provider details · sortable by any column
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SolanaLeaderboardTable
                  providers={data.providers}
                  onSelect={handleSelectProvider}
                />
              </CardContent>
            </Card>
          </DashSection>

          {/* Performance */}
          <DashSection id="performance" title="Performance">
            <div className="grid grid-cols-12 gap-4">
              {/* Latency chart — wider */}
              <div className="col-span-12 lg:col-span-7">
                <ChartCard
                  title="Latency Distribution"
                  description="P50 · P95 · P99 across all providers"
                >
                  <SolanaLatencyChart providers={data.providers} />
                </ChartCard>
              </div>

              {/* Uptime indicators — narrower */}
              <div className="col-span-12 lg:col-span-5">
                <Card className="overflow-hidden shadow-sm h-full">
                  <CardHeader className="px-4 py-3 border-b border-border/40 bg-muted/10 space-y-0.5">
                    <CardTitle className="text-sm font-sans font-medium text-foreground flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-accent" />
                      Uptime
                    </CardTitle>
                    <CardDescription className="text-xs font-sans text-muted-foreground/70">
                      Sorted best to worst · 20 dots = 100%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <SolanaUptimeIndicators providers={data.providers} />
                  </CardContent>
                </Card>
              </div>

              {/* Scatter — half width */}
              <div className="col-span-12 lg:col-span-6">
                <ChartCard
                  title="Latency vs Throughput"
                  description="JSON-RPC · REST API · Data API — size reflects provider volume"
                >
                  <SolanaScatterChart providers={data.providers} />
                </ChartCard>
              </div>

              {/* Throughput — half width */}
              <div className="col-span-12 lg:col-span-6">
                <ChartCard
                  title="Throughput Ranking"
                  description="Requests per second — sorted highest first"
                >
                  <SolanaThroughputChart providers={data.providers} />
                </ChartCard>
              </div>
            </div>
          </DashSection>

          {/* Reliability */}
          <DashSection id="reliability" title="Reliability">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-4">
                <ChartCard
                  title="Error Rate"
                  description="Best to worst · dashed line = average"
                >
                  <SolanaErrorRateChart providers={data.providers} />
                </ChartCard>
              </div>

              <div className="col-span-12 lg:col-span-4">
                <ChartCard
                  title="Rate Limits"
                  description="Max requests per second per provider"
                >
                  <SolanaRateLimitChart providers={data.providers} />
                </ChartCard>
              </div>

              <div className="col-span-12 lg:col-span-4">
                <ChartCard
                  title="Slot Freshness"
                  description="Slots behind the leader — shorter bar is better"
                >
                  <SolanaSlotSyncChart providers={data.providers} />
                </ChartCard>
              </div>
            </div>
          </DashSection>

          {/* Analysis */}
          <DashSection id="analysis" title="Analysis">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-6">
                <ChartCard
                  title="Score Breakdown"
                  description="Latency 35% · Uptime 35% · Throughput 30%"
                >
                  <SolanaScoreBreakdownChart providers={data.providers} />
                </ChartCard>
              </div>

              <div className="col-span-12 lg:col-span-6">
                <ChartCard
                  title="Latency Spread"
                  description="P50 → P95 → P99 stacked — tall cap = high variance"
                >
                  <SolanaLatencySpreadChart providers={data.providers} />
                </ChartCard>
              </div>

              <div className="col-span-12">
                <ChartCard
                  title="Cost vs Score"
                  description="Bubble size = throughput · green = free tier · upper-left is best value"
                >
                  <SolanaCostEfficiencyChart providers={data.providers} />
                </ChartCard>
              </div>

              <div className="col-span-12">
                <ChartCard
                  title="Multi-Axis Radar"
                  description="Speed · Uptime · Throughput · Reliability · Coverage — all providers overlaid"
                >
                  <SolanaRadarChart providers={data.providers} showLegend height={360} />
                </ChartCard>
              </div>
            </div>
          </DashSection>

          {/* Capabilities */}
          <DashSection id="capabilities" title="Capabilities">
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="px-4 py-3 border-b border-border/40 bg-muted/10 space-y-0.5">
                <CardTitle className="text-sm font-sans font-medium text-foreground">Feature Comparison</CardTitle>
                <CardDescription className="text-xs font-sans text-muted-foreground/70">
                  All providers side-by-side · scroll horizontally for all columns
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SolanaCapabilitiesMatrix providers={data.providers} />
              </CardContent>
            </Card>
          </DashSection>
        </div>
      )}

      {/* Footer */}
      {data && (
        <p className="text-[10px] font-sans text-muted-foreground/40 text-center pb-2">
          (sim) = simulated data · Score: latency 35% + uptime 35% + throughput 30% · maxLatency=1000ms · maxRPS=500
          <br />
          JSON-RPC = Solana getSlot benchmark · REST API = structured query · Data API = market/price endpoint
        </p>
      )}

      {/* Provider detail sheet */}
      <SolanaProviderSheet
        provider={selectedProvider}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        providers={data?.providers}
      />
    </div>
  );
}
