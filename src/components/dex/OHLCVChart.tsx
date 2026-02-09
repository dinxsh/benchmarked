'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { OHLCVData } from '@/lib/dex-types';

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
  const { data, isLoading } = useQuery({
    queryKey: ['ohlcv', pairAddress, interval, points],
    queryFn: async () => {
      const res = await fetch(
        `/api/dex/ohlcv/${pairAddress}?points=${points}`
      );
      return res.json();
    },
    refetchInterval: 60000 // 1 minute
  });

  const chartData = data?.data?.map((candle: OHLCVData) => ({
    time: new Date(candle.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    price: candle.close,
    volume: candle.volume,
    high: candle.high,
    low: candle.low,
    open: candle.open
  }));

  return (
    <div className="w-full h-full border-2 border-foreground bg-background">
      {isLoading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="h-4 w-4 border-2 border-foreground border-t-transparent animate-spin" />
        </div>
      ) : chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fontFamily: 'monospace' }}
              tickMargin={5}
              stroke="hsl(var(--foreground))"
              strokeWidth={1}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fontSize: 9, fontFamily: 'monospace' }}
              tickFormatter={(value) => `$${value.toFixed(4)}`}
              stroke="hsl(var(--foreground))"
              strokeWidth={1}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              tick={{ fontSize: 9, fontFamily: 'monospace' }}
              tickFormatter={(value) => {
                if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
                if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
                return value.toFixed(0);
              }}
              stroke="hsl(var(--foreground))"
              strokeWidth={1}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--foreground))',
                borderWidth: '2px',
                borderRadius: '0px',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}
              labelStyle={{
                color: 'hsl(var(--foreground))',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="hsl(var(--muted-foreground))"
              opacity={0.4}
            />
            <Line
              yAxisId="price"
              dataKey="price"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-[10px] font-mono text-muted-foreground uppercase">
          NO CHART DATA AVAILABLE FOR THIS PAIR
        </div>
      )}
    </div>
  );
}
