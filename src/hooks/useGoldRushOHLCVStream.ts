'use client';

/**
 * useGoldRushOHLCVStream — real-time OHLCV candles via GoldRush GraphQL WebSocket.
 *
 * Mirrors the pattern from goldrush-demos/apps/dexworks/src/hooks/useOHLCVStream.ts:
 *  - graphql-ws client with retry/backoff
 *  - connectionParams sends GOLDRUSH_API_KEY
 *  - Incoming candles merged by timestamp (last-write wins)
 *  - WETH/USDC Uniswap V3 pair on ETH_MAINNET for ETH/USD price
 *
 * Requires client-side env vars:
 *   NEXT_PUBLIC_GOLDRUSH_API_KEY
 *   NEXT_PUBLIC_GOLDRUSH_STREAM_URL  (optional, defaults to staging URL)
 */

import { createClient } from 'graphql-ws';
import { useEffect, useRef, useState } from 'react';
import type { OHLCVCandle } from '@/components/charts/CandlestickChart';

// Uniswap V3 WETH/USDC 0.05% — most liquid ETH/USD pair on Ethereum mainnet
const WETH_USDC_PAIR = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';

// Fallback configs: try 1m/1h first, then 1h/1d (same racing strategy as DexWorks)
const CONFIGS = [
  { interval: 'ONE_MINUTE', timeframe: 'ONE_HOUR',  label: '1m/1h' },
  { interval: 'ONE_HOUR',   timeframe: 'ONE_DAY',   label: '1h/1d' },
] as const;

function buildQuery(interval: string, timeframe: string): string {
  return `
subscription {
  ohlcvCandlesForPair(
    chain_name: ETH_MAINNET
    pair_addresses: ["${WETH_USDC_PAIR}"]
    interval: ${interval}
    timeframe: ${timeframe}
  ) {
    timestamp
    open
    high
    low
    close
    volume
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
      map.set(c.timestamp, c);
      changed = true;
    }
  }
  if (!changed) return existing;
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'error';

export interface GoldRushStreamState {
  candles:  OHLCVCandle[];
  status:   StreamStatus;
  label:    string | null;   // winning config label e.g. "1m/1h"
  error:    string | null;
  updateAt: number | null;   // epoch ms of last candle merge
}

export function useGoldRushOHLCVStream(): GoldRushStreamState {
  const apiKey    = process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY ?? '';
  const streamUrl = process.env.NEXT_PUBLIC_GOLDRUSH_STREAM_URL
    ?? 'wss://gr-staging-v2.streaming.covalenthq.com/graphql';

  const [state, setState] = useState<GoldRushStreamState>({
    candles: [], status: 'idle', label: null, error: null, updateAt: null,
  });

  const candlesRef  = useRef<OHLCVCandle[]>([]);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!apiKey) {
      setState(s => ({ ...s, status: 'error', error: 'NEXT_PUBLIC_GOLDRUSH_API_KEY not set' }));
      return;
    }

    setState(s => ({ ...s, status: 'connecting', error: null }));
    resolvedRef.current = false;

    const client = createClient({
      url: streamUrl,
      connectionParams: { GOLDRUSH_API_KEY: apiKey },
      keepAlive:    15_000,
      retryAttempts: 8,
      shouldRetry:   () => true,
    });

    const unsubs: Array<() => void> = [];

    // Race all configs simultaneously — first to return data wins
    CONFIGS.forEach(cfg => {
      const unsub = client.subscribe(
        { query: buildQuery(cfg.interval, cfg.timeframe) },
        {
          next: (result) => {
            const incoming = (result.data as Record<string, unknown>)
              ?.ohlcvCandlesForPair as OHLCVCandle[] | undefined;
            if (!incoming?.length) return;

            if (!resolvedRef.current) {
              // Winner — cancel losers
              resolvedRef.current = true;
              for (const u of unsubs) {
                if (u !== unsub) u();
              }
            }

            const merged = mergeCandles(candlesRef.current, incoming);
            if (merged !== candlesRef.current) {
              candlesRef.current = merged;
              setState({
                candles: merged,
                status: 'streaming',
                label: cfg.label,
                error: null,
                updateAt: Date.now(),
              });
            }
          },
          error: (err) => {
            if (resolvedRef.current) return; // ignore losers' errors
            const msg =
              err instanceof Error   ? err.message
              : Array.isArray(err)   ? (err[0]?.message ?? JSON.stringify(err))
              : String(err);
            setState(s => ({ ...s, status: 'error', error: msg.slice(0, 120) }));
          },
          complete: () => {},
        }
      );
      unsubs.push(unsub);
    });

    return () => {
      for (const u of unsubs) u();
      client.dispose();
    };
  // apiKey + streamUrl are derived from env vars — stable across renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
