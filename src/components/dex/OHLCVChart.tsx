'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { OHLCVData } from '@/lib/dex-types';
import { format } from 'date-fns';

interface OHLCVChartProps {
  pairAddress: string;
  interval?: '1m' | '5m' | '15m';
  points?: number;
}

export function OHLCVChart({
  pairAddress,
  interval = '1m',
  points = 100
}: OHLCVChartProps) {
  const [selectedInterval, setSelectedInterval] = useState<'1m' | '5m' | '15m'>(interval);

  const { data, isLoading } = useQuery({
    queryKey: ['ohlcv', pairAddress, selectedInterval, points],
    queryFn: async () => {
      const res = await fetch(
        `/api/dex/ohlcv/${pairAddress}?points=${points}`
      );
      return res.json();
    },
    refetchInterval: 60000 // 1 minute
  });

  const chartData = data?.data?.map((candle: OHLCVData) => ({
    timestamp: candle.timestamp,
    time: format(new Date(candle.timestamp), 'HH:mm'),
    price: candle.close,
    volume: candle.volume,
    high: candle.high,
    low: candle.low,
    open: candle.open
  }));

  // Calculate current price and change
  const currentPrice = chartData?.[chartData.length - 1]?.price || 0;
  const firstPrice = chartData?.[0]?.price || 0;
  const priceChange = firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

  // Get pair info
  const pairInfo = data?.pair;

  return (
    <div className="w-full h-full flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chartData && chartData.length > 0 ? (
        <>
          {/* Chart Header */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {pairInfo?.token0?.symbol || 'Unknown'}/{pairInfo?.token1?.symbol || 'Unknown'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pairInfo?.dexName || 'Unknown DEX'} • 1-minute candles
                </p>
              </div>

              {/* Time interval selector */}
              <div className="flex gap-1">
                {(['1m', '5m', '15m'] as const).map(int => (
                  <button
                    key={int}
                    className={`
                      px-3 py-1 text-xs font-medium rounded transition-colors
                      ${selectedInterval === int
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }
                    `}
                    onClick={() => setSelectedInterval(int)}
                  >
                    {int}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Price Display */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-mono font-semibold tabular-nums text-foreground">
                ${currentPrice.toFixed(6)}
              </span>
              <span className={`text-sm font-mono font-medium ${
                priceChange > 0 ? 'text-success' : 'text-destructive'
              }`}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 p-4 bg-background">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time"
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  tickMargin={8}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={(val) => `$${val.toFixed(4)}`}
                  tickMargin={8}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{
                    color: 'var(--muted-foreground)',
                    marginBottom: '4px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(6)}`, 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Footer */}
          <div className="border-t border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground uppercase tracking-wide">High</span>
                <p className="font-mono text-sm font-medium text-foreground mt-1">
                  ${Math.max(...chartData.map((d: any) => d.high)).toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground uppercase tracking-wide">Low</span>
                <p className="font-mono text-sm font-medium text-foreground mt-1">
                  ${Math.min(...chartData.map((d: any) => d.low)).toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            No chart data available
          </p>
          <p className="text-xs text-muted-foreground">
            Data may not be available for this pair yet
          </p>
        </div>
      )}
    </div>
  );
}
