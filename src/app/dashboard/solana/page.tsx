'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

  // Derived counts for header
  const liveCount = data?.providers.filter(p => !p.is_mock).length ?? 0;
  const totalCount = data?.providers.length ?? 0;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
              Solana Provider Benchmarks
            </h1>
            <Badge className="gap-1 h-5 px-1.5 text-[9px] font-mono uppercase border border-accent/60 bg-accent/10 text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Live
            </Badge>
            {data && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {liveCount}/{totalCount} live
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {totalCount > 0
              ? `${totalCount} providers — latency · uptime · throughput · capabilities`
              : 'LaserTeam · Alchemy · Helius · Ankr · QuickNode · GoldRush · Birdeye · Mobula'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {timeAgo(lastUpdated)}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={loading}
            className="h-7 text-[11px] font-mono gap-1.5"
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
        <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-[11px] font-mono text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-[12px] font-mono">
          <Loader2 className="h-4 w-4 animate-spin" />
          Running benchmarks across 8 Solana providers…
        </div>
      )}

      {data && (
        <Tabs defaultValue="overview" className="gap-3">
          <TabsList className="h-8 text-[11px] font-mono">
            <TabsTrigger value="overview" className="text-[11px] font-mono px-3">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="text-[11px] font-mono px-3">Performance</TabsTrigger>
            <TabsTrigger value="capabilities" className="text-[11px] font-mono px-3">Capabilities</TabsTrigger>
          </TabsList>

          {/* ─── Overview ─────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            <SolanaSummaryCards stats={data.stats} providers={data.providers} />

            {/* Leaderboard Table */}
            <div className="rounded border border-border overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-3 py-2 flex items-center justify-between">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Leaderboard — click row for details
                </h2>
                {data.meta.errors && data.meta.errors.length > 0 && (
                  <span className="text-[9px] font-mono text-chart-3">
                    {data.meta.errors.length} error(s)
                  </span>
                )}
              </div>
              <SolanaLeaderboardTable
                providers={data.providers}
                onSelect={handleSelectProvider}
              />
            </div>

            {/* Bottom row: Uptime | Throughput | Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 rounded border border-border overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-3 py-2">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> Uptime
                  </h2>
                </div>
                <div className="p-3">
                  <SolanaUptimeIndicators providers={data.providers} />
                </div>
              </div>

              <div className="lg:col-span-4 rounded border border-border overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-3 py-2">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Throughput (req/s)
                  </h2>
                </div>
                <div className="p-3">
                  <SolanaThroughputChart providers={data.providers} />
                </div>
              </div>

              <div className="lg:col-span-4 rounded border border-border overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-3 py-2">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Multi-Axis Radar
                  </h2>
                </div>
                <div className="p-2">
                  <SolanaRadarChart providers={data.providers} showLegend={false} height={260} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Performance ──────────────────────────────────────── */}
          <TabsContent value="performance" className="space-y-4 mt-0">
            <div className="rounded border border-border overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-3 py-2">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Latency Distribution — P50 / P95 / P99
                </h2>
              </div>
              <div className="p-3">
                <SolanaLatencyChart providers={data.providers} />
              </div>
            </div>

            <div className="rounded border border-border overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-3 py-2">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Latency vs Throughput
                  <span className="ml-2 text-muted-foreground/50 normal-case font-normal">
                    · <span style={{ color: 'hsl(var(--accent))' }}>■</span> JSON-RPC
                    <span className="ml-1" style={{ color: 'var(--chart-3)' }}>■</span> REST API
                    <span className="ml-1" style={{ color: 'hsl(var(--destructive))' }}>■</span> Data API
                  </span>
                </h2>
              </div>
              <div className="p-3">
                <SolanaScatterChart providers={data.providers} />
              </div>
            </div>

            <div className="rounded border border-border overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-3 py-2">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Multi-Axis Radar — Speed · Uptime · Throughput · Reliability · Coverage
                </h2>
              </div>
              <div className="p-3">
                <SolanaRadarChart providers={data.providers} showLegend height={380} />
              </div>
            </div>
          </TabsContent>

          {/* ─── Capabilities ─────────────────────────────────────── */}
          <TabsContent value="capabilities" className="space-y-4 mt-0">
            <div className="rounded border border-border overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-3 py-2">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Feature &amp; Capability Comparison
                </h2>
              </div>
              <SolanaCapabilitiesMatrix providers={data.providers} />
            </div>

            {/* Pricing chart */}
            <div className="rounded border border-border overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-3 py-2">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Cost per Million Requests (USD)
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {[...data.providers]
                  .sort((a, b) => a.pricing.cost_per_million - b.pricing.cost_per_million)
                  .map(p => {
                    const max = Math.max(...data.providers.map(x => x.pricing.cost_per_million));
                    const pct = max === 0 ? 0 : (p.pricing.cost_per_million / max) * 100;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono w-24 truncate ${p.is_us ? 'text-accent' : 'text-foreground'}`}>
                          {p.name}
                        </span>
                        <div className="flex-1 bg-muted/30 h-4 rounded-sm overflow-hidden">
                          <div
                            className={`h-full transition-all ${p.pricing.cost_per_million === 0 ? 'bg-accent/60' : 'bg-primary/50'}`}
                            style={{ width: p.pricing.cost_per_million === 0 ? '8px' : `${Math.max(4, pct)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono tabular-nums w-16 text-right ${p.pricing.cost_per_million === 0 ? 'text-accent' : 'text-foreground'}`}>
                          {p.pricing.cost_per_million === 0 ? 'Free' : `$${p.pricing.cost_per_million}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Footer */}
      {data && (
        <p className="text-[10px] font-mono text-muted-foreground/50 text-center pb-2">
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
      />
    </div>
  );
}
