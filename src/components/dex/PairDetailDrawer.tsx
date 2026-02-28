'use client';

import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OHLCVChart } from './OHLCVChart';
import { LivePairUpdate, OHLCVData } from '@/lib/dex-types';

interface PairDetailDrawerProps {
  pairAddress: string | null;
  liveData?: LivePairUpdate;
  onClose: () => void;
}

function StatRow({
  label,
  value,
  valueClass
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className='flex items-center justify-between py-2'>
      <span className='text-xs text-muted-foreground uppercase tracking-wide font-mono'>
        {label}
      </span>
      <span className={`text-sm font-mono font-semibold tabular-nums ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  );
}

function AddressRow({
  label,
  address
}: {
  label: string;
  address: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='flex items-center justify-between py-2'>
      <span className='text-xs text-muted-foreground uppercase tracking-wide font-mono'>
        {label}
      </span>
      <div className='flex items-center gap-1.5'>
        <span className='text-xs font-mono text-muted-foreground'>
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={handleCopy}
          className='text-muted-foreground hover:text-foreground transition-colors'
          title='Copy address'
        >
          <Copy className='h-3 w-3' />
        </button>
        {copied && (
          <span className='text-[10px] font-mono text-accent'>Copied!</span>
        )}
      </div>
    </div>
  );
}

export function PairDetailDrawer({
  pairAddress,
  liveData,
  onClose
}: PairDetailDrawerProps) {
  const isOpen = !!pairAddress;

  const { data: ohlcvData } = useQuery({
    queryKey: ['ohlcv-drawer', pairAddress],
    queryFn: async () => {
      const res = await fetch(`/api/dex/ohlcv/${pairAddress}?points=60`);
      return res.json();
    },
    enabled: !!pairAddress,
    refetchInterval: 60_000
  });

  const formatNum = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  const pair = liveData?.pair;
  const priceChange = liveData?.priceChange24h ?? 0;
  const isUp = priceChange >= 0;

  // derive 24h high/low from OHLCV history
  const candles: OHLCVData[] = ohlcvData?.data ?? [];
  const high24h = candles.length ? Math.max(...candles.map((c) => c.high)) : null;
  const low24h = candles.length ? Math.min(...candles.map((c) => c.low)) : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side='right'
        className='w-full sm:max-w-[480px] p-0 flex flex-col overflow-hidden border-l border-border'
      >
        {/* Header */}
        <SheetHeader className='px-4 py-3 border-b border-border shrink-0'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex flex-col gap-1'>
              <SheetTitle className='text-base font-mono font-bold uppercase tracking-wide'>
                {pair
                  ? `${pair.token0.symbol} / ${pair.token1.symbol}`
                  : '—'}
              </SheetTitle>
              {pair && (
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='text-[10px] font-mono uppercase border-foreground/30 px-1.5 py-0'
                  >
                    {pair.dexName}
                  </Badge>
                </div>
              )}
            </div>
            <SheetClose asChild>
              <button
                onClick={onClose}
                className='text-muted-foreground hover:text-foreground transition-colors mt-0.5'
              >
                <X className='h-4 w-4' />
              </button>
            </SheetClose>
          </div>

          {/* Price + change */}
          {liveData && (
            <div className='flex items-end gap-2 mt-2'>
              <span className='text-2xl font-mono font-bold tabular-nums'>
                ${liveData.priceUSD.toFixed(6)}
              </span>
              <span
                className={`flex items-center gap-0.5 text-sm font-mono font-semibold mb-0.5 ${
                  isUp ? 'text-green-500' : 'text-destructive'
                }`}
              >
                {isUp ? (
                  <TrendingUp className='h-3.5 w-3.5' />
                ) : (
                  <TrendingDown className='h-3.5 w-3.5' />
                )}
                {isUp ? '+' : ''}
                {priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <div className='flex-1 overflow-y-auto'>
          {/* OHLCV Chart */}
          {pairAddress && (
            <div className='h-[220px] border-b border-border shrink-0'>
              <OHLCVChart pairAddress={pairAddress} interval='1m' points={60} />
            </div>
          )}

          <div className='px-4 py-2'>
            {/* 24h Stats */}
            <p className='text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mt-3 mb-1'>
              24H STATS
            </p>
            <div className='divide-y divide-border'>
              <StatRow
                label='Volume'
                value={liveData ? formatNum(liveData.volume24hUSD) : '—'}
              />
              <StatRow
                label='Liquidity'
                value={liveData ? formatNum(liveData.liquidityUSD) : '—'}
              />
              <StatRow
                label='Transactions'
                value={liveData ? liveData.txCount24h.toLocaleString() : '—'}
              />
              {high24h !== null && (
                <StatRow label='High' value={`$${high24h.toFixed(6)}`} />
              )}
              {low24h !== null && (
                <StatRow label='Low' value={`$${low24h.toFixed(6)}`} />
              )}
            </div>

            <Separator className='my-3' />

            {/* Token details */}
            {pair && (
              <>
                <p className='text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1'>
                  TOKENS
                </p>
                <div className='divide-y divide-border'>
                  <div className='py-2'>
                    <p className='text-xs font-mono font-semibold mb-1'>
                      {pair.token0.symbol}
                      <span className='text-muted-foreground font-normal ml-1'>
                        {pair.token0.name}
                      </span>
                    </p>
                    <AddressRow label='Address' address={pair.token0.address} />
                  </div>
                  <div className='py-2'>
                    <p className='text-xs font-mono font-semibold mb-1'>
                      {pair.token1.symbol}
                      <span className='text-muted-foreground font-normal ml-1'>
                        {pair.token1.name}
                      </span>
                    </p>
                    <AddressRow label='Address' address={pair.token1.address} />
                  </div>
                </div>

                <Separator className='my-3' />

                {/* Pair address */}
                <p className='text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1'>
                  PAIR CONTRACT
                </p>
                <AddressRow label='Pair' address={pair.pairAddress} />
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
