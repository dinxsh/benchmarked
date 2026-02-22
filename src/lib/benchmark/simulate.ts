'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { rerank } from './scoring';
import type { GRProvider } from './data';

const REFRESH_INTERVAL = 60; // seconds

/** Try to convert API SolanaProvider format to GRProvider */
function convertApiProvider(p: Record<string, unknown>): GRProvider | null {
  try {
    const metrics = p.metrics as Record<string, number>;
    const pricing = p.pricing as Record<string, unknown>;
    const caps    = p.capabilities as Record<string, unknown>;

    const p50 = metrics.latency_p50;
    const p95 = metrics.latency_p95;
    const p99 = metrics.latency_p99;
    const rps = metrics.throughput_rps;
    const latencyScore    = Math.max(0, (1 - p50 / 2000)) * 100 * 0.40;
    const reliabilityScore = (metrics.uptime_percent ?? 100) * 0.35;
    const throughputScore = Math.min(100, (rps / 200) * 100) * 0.25;
    const score = typeof p.score === 'number'
      ? p.score
      : Math.round((latencyScore + reliabilityScore + throughputScore) * 10) / 10;

    const name = p.name as string;

    // Resolve capabilities from seed or build minimal fallback
    const { CAPABILITIES } = require('./data') as typeof import('./data');
    const capFromSeed = CAPABILITIES[name];

    return {
      id: (p.id as string) ?? name.toLowerCase(),
      name,
      type: (p.provider_type as GRProvider['type']) ?? 'json-rpc',
      website: (p.website_url as string) ?? '',
      isMock: (p.is_mock as boolean) ?? false,
      p50,
      p95,
      p99,
      jitter: p99 - p50,
      uptime: metrics.uptime_percent ?? 100,
      errRate: metrics.error_rate ?? 0,
      rps,
      slot: metrics.slot_height || null,
      costPerM: (pricing.cost_per_million as number) ?? 0,
      free: (pricing.cost_per_million as number) === 0,
      score,
      rank: (p.rank as number) ?? 0,
      measuredAt: (p.measured_at as string) ?? null,
      capabilities: capFromSeed ?? {
        transactions: (caps.transactions as boolean) ?? false,
        eventLogs: (caps.logs as boolean) ?? false,
        tokenBalances: (caps.token_balances as boolean) ?? false,
        nftMetadata: (caps.nft_metadata as boolean) ?? false,
        customIndexing: (caps.custom_indexing as boolean) ?? false,
        traces: (caps.traces as boolean) ?? false,
        historyDepth: (caps.historical_depth as string) ?? 'unknown',
        costPerM: (pricing.cost_per_million as number) === 0 ? 'Free' : `$${pricing.cost_per_million}`,
        rateLimit: (pricing.rate_limit as string) ?? '?',
        capScore: 50,
      },
    };
  } catch {
    return null;
  }
}

export interface LiveBenchmarkState {
  providers: GRProvider[];
  loading: boolean;
  error: string | null;
  secsLeft: number;
  lastUpdated: Date | null;
  isLive: boolean; // true = from API, false = from seed simulation
  triggerRefresh: () => void;
}

export function useLiveBenchmark(): LiveBenchmarkState {
  const [providers, setProviders] = useState<GRProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secsLeft, setSecsLeft] = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const nextRefreshAt = useRef<number>(Date.now() + REFRESH_INTERVAL * 1000);

  const fetchFromApi = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? '/api/benchmarks/solana?run=true' : '/api/benchmarks/solana';
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const converted = (json.providers as Record<string, unknown>[])
        .map(convertApiProvider)
        .filter(Boolean) as GRProvider[];
      if (converted.length > 0) {
        setProviders(rerank(converted));
        setIsLive(true);
        setLastUpdated(new Date(json.last_updated));
      } else {
        throw new Error('No providers in API response');
      }
    } catch {
      // On failure: keep previous data unchanged — don't fake reliability numbers
      setIsLive(false);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerRefresh = useCallback(() => {
    nextRefreshAt.current = Date.now() + REFRESH_INTERVAL * 1000;
    setSecsLeft(REFRESH_INTERVAL);
    fetchFromApi(true);
  }, [fetchFromApi]);

  // Initial load
  useEffect(() => { fetchFromApi(false); }, [fetchFromApi]);

  // Countdown + auto-refresh
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((nextRefreshAt.current - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining === 0) {
        nextRefreshAt.current = Date.now() + REFRESH_INTERVAL * 1000;
        fetchFromApi(false);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [fetchFromApi]);

  return { providers, loading, error, secsLeft, lastUpdated, isLive, triggerRefresh };
}
