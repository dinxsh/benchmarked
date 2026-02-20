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

/** Blue tonal scale — rank 0 is brightest */
function barOpacity(index: number): number {
  return Math.max(0.35, 1 - index * 0.10);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rps = payload[0]?.value ?? 0;
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-lg px-3.5 py-3 text-xs shadow-lg min-w-[148px]">
      <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Throughput</span>
        <span className="font-mono tabular-nums font-medium" style={{ color: '#60a5fa' }}>{rps} req/s</span>
      </div>
    </div>
  );
};

export function SolanaThroughputChart({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps);

  const medianRps = (() => {
    const vals = sorted.map(p => p.metrics.throughput_rps).slice().sort((a, b) => a - b);
    return vals[Math.floor(vals.length / 2)] || 1;
  })();
  const maxRps = sorted[0]?.metrics.throughput_rps || 1;

  const data = sorted.map((p, i) => ({
    name:          p.name,
    rps:           p.metrics.throughput_rps,
    rank:          i,
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
          strokeOpacity={0.35}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          unit=" rps"
          tickCount={5}
          domain={[0, Math.max(maxRps * 1.1, 10)]}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.12 }}
        />

        {/* Median reference */}
        <ReferenceLine
          x={medianRps}
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.18}
          strokeDasharray="2 4"
          label={{ value: 'median', fill: 'var(--color-muted-foreground)', fontSize: 9, opacity: 0.35, position: 'insideTopRight' }}
        />

        <Bar
          dataKey="rps"
          name="Throughput"
          radius={[3, 3, 3, 3]}
          maxBarSize={16}
        >
          {data.map((entry) => (
            <Cell
              key={`cell-${entry.rank}`}
              fill="#60a5fa"
              fillOpacity={barOpacity(entry.rank)}
            />
          ))}
          <LabelList
            dataKey="ratioToMedian"
            position="right"
            content={(props: any) => {
              const { x, y, width, height, value } = props;
              const cx = (x as number) + (width as number) + 6;
              const cy = (y as number) + (height as number) / 2;
              const ratio = value as number;
              return (
                <text
                  x={cx} y={cy}
                  fill={ratio >= 1.5 ? '#60a5fa' : 'var(--color-muted-foreground)'}
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                  dominantBaseline="central"
                  opacity={ratio >= 1.5 ? 0.85 : 0.60}
                >
                  {ratio.toFixed(1)}×
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
