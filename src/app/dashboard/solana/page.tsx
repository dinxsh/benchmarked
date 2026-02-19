'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SolanaLeaderboardTable, type SolanaProvider } from '@/components/solana/SolanaLeaderboardTable';
import { SolanaLatencyChart } from '@/components/solana/SolanaLatencyChart';
import { SolanaThroughputChart } from '@/components/solana/SolanaThroughputChart';
import { SolanaUptimeIndicators } from '@/components/solana/SolanaUptimeIndicators';
import { SolanaSummaryCards } from '@/components/solana/SolanaSummaryCards';

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

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => {
      fetchData();
      setTick(t => t + 1);
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Relative time ticker
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
              Solana Provider Benchmarks
            </h1>
            <Badge className="gap-1 h-5 px-1.5 text-[9px] font-mono uppercase border border-green-400/60 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            GoldRush vs Birdeye · Mobula · LaserTeam · Alchemy — latency, uptime &amp; throughput
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-muted-foreground">
              Last: {timeAgo(lastUpdated)}
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
        <div className="rounded border border-red-300 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-[11px] font-mono text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-[12px] font-mono">
          <Loader2 className="h-4 w-4 animate-spin" />
          Running benchmarks across 5 Solana providers…
        </div>
      )}

      {data && (
        <>
          {/* KPI Summary Cards */}
          <SolanaSummaryCards stats={data.stats} providers={data.providers} />

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Leaderboard table */}
            <div className="lg:col-span-7 rounded border border-border overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-3 py-2 flex items-center justify-between">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Comparison Table
                </h2>
                {data.meta.errors && data.meta.errors.length > 0 && (
                  <span className="text-[9px] font-mono text-yellow-600 dark:text-yellow-400">
                    {data.meta.errors.length} error(s)
                  </span>
                )}
              </div>
              <SolanaLeaderboardTable providers={data.providers} />
            </div>

            {/* Right: Charts */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Uptime */}
              <div className="rounded border border-border overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-3 py-2">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> Uptime
                  </h2>
                </div>
                <div className="p-3">
                  <SolanaUptimeIndicators providers={data.providers} />
                </div>
              </div>

              {/* Throughput */}
              <div className="rounded border border-border overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-3 py-2">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Throughput (req/s)
                  </h2>
                </div>
                <div className="p-3">
                  <SolanaThroughputChart providers={data.providers} />
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Latency Chart */}
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

          {/* Footer note */}
          <p className="text-[10px] font-mono text-muted-foreground/60 text-center pb-2">
            (sim) = simulated data (no API key configured) · Scores weighted: latency 35% + uptime 35% + throughput 30%
          </p>
        </>
      )}
    </div>
  );
}
