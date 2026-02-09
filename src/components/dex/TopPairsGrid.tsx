'use client';

import { useState, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LivePairUpdate } from '@/lib/dex-types';
import { useRealtimePairs } from '@/hooks/use-realtime-pairs';

interface TopPairsGridProps {
  onPairSelect?: (pairAddress: string) => void;
}

export function TopPairsGrid({ onPairSelect }: TopPairsGridProps) {
  const [flashStates, setFlashStates] = useState<Map<string, 'green' | 'red' | null>>(new Map());
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  // Memoize the price update callback to prevent infinite re-renders
  const handlePriceUpdate = useCallback((update: LivePairUpdate) => {
    const previousPrice = previousPricesRef.current.get(update.pair.pairAddress);
    if (previousPrice !== undefined && previousPrice !== update.priceUSD) {
      // Flash green if price increased, red if decreased
      const flashColor = update.priceUSD > previousPrice ? 'green' : 'red';
      setFlashStates(prev => new Map(prev).set(update.pair.pairAddress, flashColor));

      // Clear flash after 500ms
      setTimeout(() => {
        setFlashStates(prev => {
          const next = new Map(prev);
          next.delete(update.pair.pairAddress);
          return next;
        });
      }, 500);
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
      <div className="flex items-center justify-center py-8">
        <div className="h-4 w-4 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!pairs || pairs.length === 0) {
    return (
      <div className="text-center py-8 text-[10px] font-mono text-muted-foreground uppercase border-2 border-dashed border-muted-foreground/30 m-2">
        NO PAIRS AVAILABLE. UPLOAD CSV TO GET STARTED.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Connection Status Indicator */}
      <div className="flex items-center justify-end gap-2 px-2 py-1 border-b border-muted">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
        {isConnected && latency > 0 && (
          <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-mono border-muted-foreground/30">
            {latency}ms
          </Badge>
        )}
      </div>

      <table className="w-full border-collapse font-mono text-[11px]">
        <thead>
          <tr className="border-b border-foreground bg-muted/30">
            <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">RNK</th>
            <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PAIR</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PRICE</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">24H %</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">VOLUME</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">LIQUIDITY</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">TXS</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair: LivePairUpdate, idx: number) => {
            const flashState = flashStates.get(pair.pair.pairAddress);
            const flashClass = flashState === 'green' ? 'flash-green' : flashState === 'red' ? 'flash-red' : '';

            return (
              <tr
                key={pair.pair.pairAddress}
                className={`border-b border-muted ${
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                } hover:bg-muted/30 transition-colors cursor-pointer ${flashClass}`}
                onClick={() => onPairSelect?.(pair.pair.pairAddress)}
              >
                <td className="py-1.5 px-2 font-bold text-muted-foreground">
                  #{idx + 1}
                </td>
                <td className="py-1.5 px-2">
                  <div className="font-semibold">{pair.pair.token0.symbol}/{pair.pair.token1.symbol}</div>
                  <div className="text-[9px] text-muted-foreground uppercase">{pair.pair.dexName}</div>
                </td>
                <td className="py-1.5 px-2 text-right font-semibold tabular-nums">
                  ${pair.priceUSD.toFixed(6)}
                </td>
                <td className={`py-1.5 px-2 text-right font-bold tabular-nums ${
                  pair.priceChange24h > 0 ? 'text-accent' : 'text-destructive'
                }`}>
                  {pair.priceChange24h > 0 ? (
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="inline h-3 w-3 mr-1" />
                  )}
                  {pair.priceChange24h > 0 ? '+' : ''}
                  {pair.priceChange24h.toFixed(2)}%
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  ${formatNumber(pair.volume24hUSD)}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  ${formatNumber(pair.liquidityUSD)}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {pair.txCount24h}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
