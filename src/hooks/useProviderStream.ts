'use client';

/**
 * useProviderStream — unified streaming interface for all 4 chart-race providers.
 *
 * Every hook accepts a TokenPair so the user can switch pairs via a dropdown.
 * Changing pair.id tears down the old connection and starts a fresh one.
 *
 * Exports:
 *   useGoldRushStream  — graphql-ws WSS  (NEXT_PUBLIC_GOLDRUSH_API_KEY)
 *   useBitqueryStream  — graphql-ws WSS  (NEXT_PUBLIC_BITQUERY_API_KEY)
 *   useCoinGeckoStream — 10 s REST poll  via /api/chart-race
 *   useMoralisStream   — 10 s REST poll  via /api/chart-race
 */

import { createClient } from 'graphql-ws';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OHLCVCandle } from '@/components/charts/CandlestickChart';
import type { TokenPair } from '@/lib/pairs';

// ── Public types ──────────────────────────────────────────────────────────────

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'error';
export type ConnType     = 'WSS' | 'REST';

export interface StreamMetrics {
  firstLatency:  number | null;  // ms from hook init → first data
  updatesPerMin: number;          // rolling 60 s window
  uptimeSeconds: number;          // seconds since first data
  totalUpdates:  number;
  lastUpdateAt:  number | null;
}

export interface ProviderStreamState {
  candles:  OHLCVCandle[];
  status:   StreamStatus;
  metrics:  StreamMetrics;
  connType: ConnType;
  label:    string | null;  // e.g. "1m/1h", "~30m", "1d OHLCV"
  error:    string | null;
}

// ── Internal metrics helper ───────────────────────────────────────────────────

function makeMetrics(): StreamMetrics {
  return { firstLatency: null, updatesPerMin: 0, uptimeSeconds: 0, totalUpdates: 0, lastUpdateAt: null };
}

function useMetricsState() {
  const [metrics, setMetrics] = useState<StreamMetrics>(makeMetrics);
  const startedAtRef   = useRef<number | null>(null);
  const initAtRef      = useRef<number>(Date.now());
  const updateTimesRef = useRef<number[]>([]);
  const uptimeTimer    = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    startedAtRef.current   = null;
    initAtRef.current      = Date.now();
    updateTimesRef.current = [];
    if (uptimeTimer.current) { clearInterval(uptimeTimer.current); uptimeTimer.current = null; }
    setMetrics(makeMetrics());
  }, []);

  const onData = useCallback(() => {
    const now     = Date.now();
    const isFirst = startedAtRef.current === null;

    if (isFirst) {
      startedAtRef.current = now;
      uptimeTimer.current = setInterval(() => {
        const up = Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
        setMetrics(m => ({ ...m, uptimeSeconds: up }));
      }, 1_000);
    }

    updateTimesRef.current.push(now);
    const cutoff = now - 60_000;
    updateTimesRef.current = updateTimesRef.current.filter(t => t > cutoff);

    setMetrics(m => ({
      ...m,
      firstLatency:  isFirst ? now - initAtRef.current : m.firstLatency,
      updatesPerMin: updateTimesRef.current.length,
      totalUpdates:  m.totalUpdates + 1,
      lastUpdateAt:  now,
    }));
  }, []);

  useEffect(() => { return () => { if (uptimeTimer.current) clearInterval(uptimeTimer.current); }; }, []);

  return { metrics, reset, onData };
}

// ── GoldRush WebSocket ────────────────────────────────────────────────────────

const GR_CONFIGS = [
  { interval: 'ONE_MINUTE', timeframe: 'ONE_HOUR', label: '1m/1h' },
  { interval: 'ONE_HOUR',   timeframe: 'ONE_DAY',  label: '1h/1d' },
] as const;

function buildGRQuery(pairAddress: string, interval: string, timeframe: string): string {
  return `subscription {
  ohlcvCandlesForPair(
    chain_name: ETH_MAINNET
    pair_addresses: ["${pairAddress}"]
    interval: ${interval}
    timeframe: ${timeframe}
  ) {
    timestamp open high low close volume
  }
}`;
}

function mergeCandles(existing: OHLCVCandle[], incoming: OHLCVCandle[]): OHLCVCandle[] {
  const map = new Map<string, OHLCVCandle>();
  for (const c of existing) map.set(c.timestamp, c);
  let changed = false;
  for (const c of incoming) {
    const prev = map.get(c.timestamp);
    if (!prev || prev.close !== c.close || prev.high !== c.high) {
      map.set(c.timestamp, c); changed = true;
    }
  }
  if (!changed) return existing;
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function useGoldRushStream(pair: TokenPair): ProviderStreamState {
  const apiKey    = process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY ?? '';
  const streamUrl = process.env.NEXT_PUBLIC_GOLDRUSH_STREAM_URL
    ?? 'wss://gr-staging-v2.streaming.covalenthq.com/graphql';

  const { metrics, reset, onData } = useMetricsState();
  const [state, setState] = useState<Omit<ProviderStreamState, 'metrics'>>({
    candles: [], status: 'idle', connType: 'WSS', label: null, error: null,
  });
  const candlesRef  = useRef<OHLCVCandle[]>([]);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!apiKey) {
      setState(s => ({ ...s, status: 'error', error: 'NEXT_PUBLIC_GOLDRUSH_API_KEY not set' }));
      return;
    }

    reset();
    setState({ candles: [], status: 'connecting', connType: 'WSS', label: null, error: null });
    resolvedRef.current = false;
    candlesRef.current  = [];

    const client = createClient({
      url: streamUrl,
      connectionParams: { GOLDRUSH_API_KEY: apiKey },
      keepAlive: 15_000, retryAttempts: 8, shouldRetry: () => true,
    });

    const unsubs: Array<() => void> = [];

    GR_CONFIGS.forEach(cfg => {
      const unsub = client.subscribe(
        { query: buildGRQuery(pair.grPairAddress, cfg.interval, cfg.timeframe) },
        {
          next: (result) => {
            const incoming = (result.data as Record<string, unknown>)
              ?.ohlcvCandlesForPair as OHLCVCandle[] | undefined;
            if (!incoming?.length) return;

            if (!resolvedRef.current) {
              resolvedRef.current = true;
              for (const u of unsubs) { if (u !== unsub) u(); }
            }

            const merged = mergeCandles(candlesRef.current, incoming);
            if (merged !== candlesRef.current) {
              candlesRef.current = merged;
              onData();
              setState({ candles: merged, status: 'streaming', connType: 'WSS', label: cfg.label, error: null });
            }
          },
          error: (err) => {
            if (resolvedRef.current) return;
            const msg =
              err instanceof Error ? err.message
              : Array.isArray(err)  ? ((err[0] as { message?: string })?.message ?? JSON.stringify(err))
              : String(err);
            setState(s => ({ ...s, status: 'error', error: msg.slice(0, 140) }));
          },
          complete: () => {},
        }
      );
      unsubs.push(unsub);
    });

    return () => { for (const u of unsubs) u(); client.dispose(); };
  // pair.id change → reconnect with new pair address
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.id]);

  return { ...state, metrics };
}

// ── Bitquery WebSocket ────────────────────────────────────────────────────────

function buildBQSubscription(baseAddress: string, quoteAddress: string): string {
  return `subscription {
  EVM(network: eth) {
    DEXTradeByTokens(
      where: {
        Trade: {
          Currency: { SmartContract: { is: "${baseAddress}" } }
          Side: { Currency: { SmartContract: { is: "${quoteAddress}" } } }
        }
      }
    ) {
      Block { Time }
      Trade { PriceInUSD }
    }
  }
}`;
}

interface TradeEvent { time: number; price: number; volume: number; }

function aggregateToCandles(events: TradeEvent[]): OHLCVCandle[] {
  if (events.length === 0) return [];
  const HOUR_MS = 3_600_000;
  const buckets = new Map<number, {
    open: number; openTime: number;
    high: number; low: number;
    close: number; closeTime: number;
    volume: number;
  }>();

  for (const e of events) {
    const bucket = Math.floor(e.time / HOUR_MS) * HOUR_MS;
    const b = buckets.get(bucket);
    if (!b) {
      buckets.set(bucket, {
        open: e.price, openTime: e.time, high: e.price, low: e.price,
        close: e.price, closeTime: e.time, volume: e.volume,
      });
    } else {
      if (e.time < b.openTime)  { b.open = e.price; b.openTime = e.time; }
      if (e.time > b.closeTime) { b.close = e.price; b.closeTime = e.time; }
      b.high    = Math.max(b.high, e.price);
      b.low     = Math.min(b.low,  e.price);
      b.volume += e.volume;
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, b]) => ({
      timestamp: new Date(ts).toISOString(),
      open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
    }));
}

// How long to wait for first WS data before declaring an error
const BQ_TIMEOUT_MS = 20_000;

export function useBitqueryStream(pair: TokenPair): ProviderStreamState {
  const apiKey = process.env.NEXT_PUBLIC_BITQUERY_API_KEY ?? '';

  const { metrics, reset, onData } = useMetricsState();
  const [state, setState] = useState<Omit<ProviderStreamState, 'metrics'>>({
    candles: [], status: 'idle', connType: 'WSS', label: '1d OHLCV', error: null,
  });
  const eventsRef   = useRef<TradeEvent[]>([]);

  useEffect(() => {
    if (!apiKey) {
      setState(s => ({ ...s, status: 'error', error: 'NEXT_PUBLIC_BITQUERY_API_KEY not set' }));
      return;
    }

    reset();
    setState({ candles: [], status: 'connecting', connType: 'WSS', label: '1d OHLCV', error: null });
    eventsRef.current = [];

    const client = createClient({
      url: 'wss://streaming.bitquery.io/eap',
      connectionParams: () => ({
        Authorization: `Bearer ${apiKey}`,
        'X-API-KEY':   apiKey,
      }),
      keepAlive: 15_000, retryAttempts: 3, shouldRetry: () => true,
    });

    // If no data arrives within BQ_TIMEOUT_MS, surface an error instead of
    // spinning forever (expired token, wrong subscription format, etc.)
    const noDataTimer = setTimeout(() => {
      setState(s => {
        if (s.status === 'connecting') {
          return {
            ...s, status: 'error',
            error: `No stream data after ${BQ_TIMEOUT_MS / 1000}s — API key may be expired or subscription rejected`,
          };
        }
        return s;
      });
    }, BQ_TIMEOUT_MS);

    const query = buildBQSubscription(pair.bqBaseAddress, pair.bqQuoteAddress);

    const unsub = client.subscribe(
      { query },
      {
        next: (result) => {
          clearTimeout(noDataTimer);

          type BQRow = { Block: { Time: string }; Trade: { PriceInUSD: number } };
          const evm  = (result.data as Record<string, unknown>)?.EVM as
            { DEXTradeByTokens: BQRow[] } | undefined;
          const rows = evm?.DEXTradeByTokens;
          if (!rows?.length) return;

          for (const row of rows) {
            const t = new Date(row.Block.Time).getTime();
            if (!isNaN(t) && row.Trade.PriceInUSD > 0) {
              eventsRef.current.push({ time: t, price: row.Trade.PriceInUSD, volume: 0 });
            }
          }

          // Rolling 24-hour window
          const cutoff = Date.now() - 86_400_000;
          eventsRef.current = eventsRef.current.filter(e => e.time > cutoff);

          const candles = aggregateToCandles(eventsRef.current);
          if (candles.length > 0) {
            onData();
            setState({ candles, status: 'streaming', connType: 'WSS', label: '1d OHLCV', error: null });
          }
        },
        error: (err) => {
          clearTimeout(noDataTimer);
          const msg =
            err instanceof Error ? err.message
            : Array.isArray(err)  ? ((err[0] as { message?: string })?.message ?? JSON.stringify(err))
            : String(err);
          setState(s => ({ ...s, status: 'error', error: msg.slice(0, 220) }));
        },
        complete: () => {},
      }
    );

    return () => {
      clearTimeout(noDataTimer);
      unsub();
      client.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.id]);

  return { ...state, metrics };
}

// ── REST polling (shared) ─────────────────────────────────────────────────────

const POLL_MS = 10_000;

function useRestPollingStream(
  provider: 'coingecko' | 'moralis',
  pair: TokenPair,
  fallbackLabel: string,
): ProviderStreamState {
  const { metrics, reset, onData } = useMetricsState();
  const [state, setState] = useState<Omit<ProviderStreamState, 'metrics'>>({
    candles: [], status: 'idle', connType: 'REST', label: fallbackLabel, error: null,
  });

  useEffect(() => {
    // Build URL for this provider + pair
    const url = provider === 'coingecko'
      ? `/api/chart-race?provider=coingecko&days=1&coinId=${pair.cgCoinId}`
      : `/api/chart-race?provider=moralis&days=1&pairAddress=${pair.mlPairAddress}`;

    reset();
    setState({ candles: [], status: 'idle', connType: 'REST', label: fallbackLabel, error: null });
    let active = true;

    const poll = async () => {
      if (!active) return;
      setState(s => ({ ...s, status: s.status === 'idle' ? 'connecting' : s.status }));
      try {
        const res  = await fetch(url);
        const data = await res.json() as {
          status: string; candles?: OHLCVCandle[]; candleInterval?: string; error?: string;
        };
        if (!active) return;
        if (data.status === 'success' && Array.isArray(data.candles)) {
          onData();
          setState({
            candles: data.candles, status: 'streaming', connType: 'REST',
            label: data.candleInterval ?? fallbackLabel, error: null,
          });
        } else {
          setState(s => ({ ...s, status: 'error', error: data.error ?? 'Request failed' }));
        }
      } catch (err) {
        if (!active) return;
        setState(s => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Network error' }));
      }
    };

    void poll();
    const id = setInterval(poll, POLL_MS);
    return () => { active = false; clearInterval(id); };
  // pair.id change → restart polling for the new pair
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.id]);

  return { ...state, metrics };
}

export function useCoinGeckoStream(pair: TokenPair): ProviderStreamState {
  return useRestPollingStream('coingecko', pair, '~30m');
}

export function useMoralisStream(pair: TokenPair): ProviderStreamState {
  return useRestPollingStream('moralis', pair, '~1h');
}
