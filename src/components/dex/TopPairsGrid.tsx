'use client';

import { useState, useRef, useCallback } from 'react';
import { LivePairUpdate } from '@/lib/dex-types';
import { useRealtimePairs } from '@/hooks/use-realtime-pairs';

interface TopPairsGridProps {
  onPairSelect?: (pairAddress: string) => void;
}

export function TopPairsGrid({ onPairSelect }: TopPairsGridProps) {
  const [flashStates, setFlashStates] = useState<Map<string, 'green' | 'red' | null>>(new Map());
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  // Memoize the price update callback with slower pulse animation
  const handlePriceUpdate = useCallback((update: LivePairUpdate) => {
    const previousPrice = previousPricesRef.current.get(update.pair.pairAddress);
    if (previousPrice !== undefined && previousPrice !== update.priceUSD) {
      // Pulse green if price increased, red if decreased
      const flashColor = update.priceUSD > previousPrice ? 'green' : 'red';
      setFlashStates(prev => new Map(prev).set(update.pair.pairAddress, flashColor));

      // Clear pulse after 1200ms (slower than brutalist)
      setTimeout(() => {
        setFlashStates(prev => {
          const next = new Map(prev);
          next.delete(update.pair.pairAddress);
          return next;
        });
      }, 1200);
    }
    previousPricesRef.current.set(update.pair.pairAddress, update.priceUSD);
  }, []);

  // Use real-time hook with 1-second polling
  const { pairs, isLoading, isConnected, latency } = useRealtimePairs({
    pollingInterval: 1000,
    onPriceUpdate: handlePriceUpdate
  });

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pairs || pairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          No pairs available
        </p>
        <p className="text-xs text-muted-foreground">
          Upload CSV or wait for streaming data
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top 20 Pairs by Volume
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-xs font-medium text-muted-foreground">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            {isConnected && latency > 0 && (
              <span className="text-xs text-muted-foreground">
                {latency}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pair
            </th>
            <th className="text-right py-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Price
            </th>
            <th className="text-right py-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              24h Change
            </th>
            <th className="text-right py-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Volume
            </th>
            <th className="text-right py-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Liquidity
            </th>
          </tr>
        </thead>
        <tbody>
          {pairs.slice(0, 20).map((pair: LivePairUpdate, idx: number) => {
            const flashState = flashStates.get(pair.pair.pairAddress);
            const pulseClass = flashState === 'green' ? 'pulse-green' : flashState === 'red' ? 'pulse-red' : '';

            return (
              <tr
                key={pair.pair.pairAddress}
                className={`border-b border-border cursor-pointer ${pulseClass}`}
                onClick={() => onPairSelect?.(pair.pair.pairAddress)}
              >
                <td className="py-3 px-4">
                  <div className="font-medium text-foreground">
                    {pair.pair.token0.symbol}/{pair.pair.token1.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {pair.pair.dexName}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm tabular-nums text-foreground">
                  ${pair.priceUSD.toFixed(6)}
                </td>
                <td className={`py-3 px-4 text-right font-mono text-sm font-medium tabular-nums ${
                  pair.priceChange24h > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {pair.priceChange24h > 0 ? '+' : ''}
                  {pair.priceChange24h.toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm tabular-nums text-muted-foreground">
                  ${formatNumber(pair.volume24hUSD)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm tabular-nums text-muted-foreground">
                  ${formatNumber(pair.liquidityUSD)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
