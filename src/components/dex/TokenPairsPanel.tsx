'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OHLCVChart } from './OHLCVChart';
import { Activity } from 'lucide-react';

interface TokenPairsPanelProps {
  tokenAddress: string;
}

export function TokenPairsPanel({ tokenAddress }: TokenPairsPanelProps) {
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tokenPairs', tokenAddress],
    queryFn: async () => {
      const res = await fetch(`/api/dex/tokens/${tokenAddress}`);
      return res.json();
    },
    refetchInterval: 5000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-4 w-4 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  const tokenData = data?.data;
  const pairs = tokenData?.pairs || [];

  return (
    <div className="h-full flex flex-col">
      {/* Token Header */}
      <div className="border-b-2 border-foreground px-3 py-2 bg-muted/50">
        <h2 className="text-[12px] font-mono font-bold uppercase tracking-wider">
          {tokenData?.token?.symbol} • {pairs.length} PAIRS
        </h2>
        <div className="text-[9px] font-mono text-muted-foreground mt-1">
          VOL: ${(tokenData?.aggregated?.totalVolume24hUSD || 0).toLocaleString()}
          • LIQ: ${(tokenData?.aggregated?.totalLiquidity || 0).toLocaleString()}
        </div>
      </div>

      {/* Pairs List (scrollable) */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono text-[10px]">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-foreground">
              <th className="text-left py-1 px-2 text-[9px] font-bold uppercase">PAIR</th>
              <th className="text-right py-1 px-2 text-[9px] font-bold uppercase">PRICE</th>
              <th className="text-right py-1 px-2 text-[9px] font-bold uppercase">VOL</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pairUpdate: any, idx: number) => (
              <tr
                key={pairUpdate.pair.pairAddress}
                className={`border-b border-muted cursor-pointer ${
                  selectedPair === pairUpdate.pair.pairAddress ? 'bg-accent/20' : 'hover:bg-muted/20'
                }`}
                onClick={() => setSelectedPair(pairUpdate.pair.pairAddress)}
              >
                <td className="py-1 px-2 font-semibold uppercase">
                  {pairUpdate.pair.token0.symbol}/{pairUpdate.pair.token1.symbol}
                </td>
                <td className="py-1 px-2 text-right tabular-nums">
                  ${pairUpdate.priceUSD.toFixed(4)}
                </td>
                <td className="py-1 px-2 text-right tabular-nums text-muted-foreground">
                  ${(pairUpdate.volume24hUSD / 1000).toFixed(1)}K
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OHLCV Chart */}
      {selectedPair ? (
        <div className="border-t-2 border-foreground" style={{ height: '300px' }}>
          <OHLCVChart pairAddress={selectedPair} interval="1m" points={100} />
        </div>
      ) : (
        <div className="border-t-2 border-foreground flex items-center justify-center h-[300px]">
          <div className="text-center">
            <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              SELECT PAIR TO VIEW CHART
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
