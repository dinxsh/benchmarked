'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TokenInfo } from '@/lib/dex-types';

interface TokenData {
  token: TokenInfo;
  pairCount: number;
  totalVolume24hUSD: number;
  totalLiquidity: number;
  priceUSD: number;
  priceChange24h: number;
}

interface TokensTableProps {
  onTokenSelect?: (tokenAddress: string) => void;
}

export function TokensTable({ onTokenSelect }: TokensTableProps) {
  const [flashStates] = useState<Map<string, 'green' | 'red' | null>>(new Map());
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  const { data, isLoading } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      const res = await fetch('/api/dex/tokens?sortBy=volume&limit=20');
      return res.json();
    },
    refetchInterval: 1000 // 1 second polling
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

  const tokens: TokenData[] = data?.data || [];

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8 text-[10px] font-mono text-muted-foreground uppercase border-2 border-dashed border-muted-foreground/30 m-2">
        NO TOKENS AVAILABLE. STARTING STREAM...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse font-mono text-[11px]">
        <thead>
          <tr className="border-b-2 border-foreground bg-muted/30">
            <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">RNK</th>
            <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">TOKEN</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PRICE</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">24H %</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">VOLUME</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">LIQUIDITY</th>
            <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PAIRS</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tokenData: TokenData, idx: number) => {
            const priceChange = tokenData.priceChange24h;

            return (
              <tr
                key={tokenData.token.address}
                className={`border-b border-muted ${
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                } hover:bg-muted/30 transition-colors cursor-pointer`}
                onClick={() => onTokenSelect?.(tokenData.token.address)}
              >
                <td className="py-1.5 px-2 font-bold text-muted-foreground">
                  #{idx + 1}
                </td>
                <td className="py-1.5 px-2">
                  <div className="font-semibold uppercase">{tokenData.token.symbol}</div>
                  <div className="text-[9px] text-muted-foreground truncate max-w-[150px]">
                    {tokenData.token.name}
                  </div>
                </td>
                <td className="py-1.5 px-2 text-right font-semibold tabular-nums">
                  ${tokenData.priceUSD.toFixed(4)}
                </td>
                <td className={`py-1.5 px-2 text-right font-bold tabular-nums ${
                  priceChange > 0 ? 'text-accent' : 'text-destructive'
                }`}>
                  {priceChange > 0 ? '+' : ''}
                  {priceChange.toFixed(2)}%
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  ${formatNumber(tokenData.totalVolume24hUSD)}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  ${formatNumber(tokenData.totalLiquidity)}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {tokenData.pairCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
