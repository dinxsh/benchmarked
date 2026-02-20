'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rps = payload[0]?.value ?? 0;
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-lg px-3.5 py-3 text-xs shadow-lg min-w-[140px]">
      <p className="text-[10px] font-semibold text-foreground mb-2">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Throughput</span>
        <span className="font-mono tabular-nums font-medium text-accent">{rps} req/s</span>
      </div>
    </div>
  );
};

export function SolanaThroughputChart({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps);

  // Compute median RPS for relative scale labels
  const rpsValues = [...sorted.map(p => p.metrics.throughput_rps)].sort((a, b) => a - b);
  const medianRps = rpsValues[Math.floor(rpsValues.length / 2)] || 1;
  const maxRps    = sorted[0]?.metrics.throughput_rps || 1;

  const data = sorted.map((p, i) => ({
    name:          p.name,
    rps:           p.metrics.throughput_rps,
    isUs:          p.is_us,
    isFirst:       i === 0,
    ratioToMedian: p.metrics.throughput_rps / medianRps,
  }));

  const chartHeight = Math.max(220, sorted.length * 40 + 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 80, left: 4, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="2 6"
          stroke="var(--color-border)"
          horizontal={false}
          strokeOpacity={0.4}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          unit=" rps"
          tickCount={5}
          domain={[0, Math.max(maxRps * 1.1, 10)]}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={86}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.15 }}
        />

        {/* 500 rps cap reference */}
        <ReferenceLine
          x={500}
          stroke="var(--color-chart-3)"
          strokeOpacity={0.25}
          strokeDasharray="4 4"
          label={{ value: '500 cap', fill: 'var(--color-chart-3)', fontSize: 9, opacity: 0.45, position: 'insideTopRight' }}
        />
        {/* Median reference */}
        <ReferenceLine
          x={medianRps}
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.20}
          strokeDasharray="2 4"
          label={{ value: 'median', fill: 'var(--color-muted-foreground)', fontSize: 9, opacity: 0.35, position: 'insideTopRight' }}
        />

        <Bar
          dataKey="rps"
          name="Throughput"
          radius={[3, 3, 3, 3]}
          maxBarSize={16}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isUs ? 'var(--color-accent)' : 'var(--color-primary)'}
              fillOpacity={entry.isUs ? 1 : 0.72}
            />
          ))}
          {/* Relative scale annotation */}
          <LabelList
            dataKey="ratioToMedian"
            position="right"
            content={(props: any) => {
              const { x, y, width, height, value } = props;
              const cx = (x as number) + (width as number) + 6;
              const cy = (y as number) + (height as number) / 2;
              const ratio = value as number;
              // Show "1.0×" for top, relative ratios for others
              const label = ratio.toFixed(1) + '×';
              return (
                <text
                  x={cx} y={cy}
                  fill={ratio >= 1 ? 'var(--color-accent)' : 'var(--color-muted-foreground)'}
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                  dominantBaseline="central"
                  opacity={ratio >= 1 ? 0.65 : 0.45}
                >
                  {label}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
