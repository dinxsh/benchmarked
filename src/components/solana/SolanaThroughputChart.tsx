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
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-lg px-3.5 py-3 text-xs shadow-lg min-w-[130px]">
      <p className="text-[10px] font-semibold text-foreground mb-2">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Throughput</span>
        <span className="font-mono tabular-nums font-medium text-accent">{payload[0].value} req/s</span>
      </div>
    </div>
  );
};

export function SolanaThroughputChart({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps);
  const data = sorted.map(p => ({
    name: p.name,
    rps: p.metrics.throughput_rps,
    isUs: p.is_us,
  }));

  const max = Math.max(...data.map(d => d.rps), 1);
  const chartHeight = Math.max(200, sorted.length * 36 + 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 56, left: 4, bottom: 0 }}
        barCategoryGap="32%"
      >
        <CartesianGrid
          strokeDasharray="2 6"
          stroke="var(--color-border)"
          horizontal={false}
          strokeOpacity={0.5}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          unit=" rps"
          tickCount={5}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={82}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.18 }}
        />

        {/* Cap reference at 500 rps */}
        <ReferenceLine
          x={500}
          stroke="var(--color-chart-3)"
          strokeOpacity={0.3}
          strokeDasharray="4 4"
          label={{ value: '500 cap', fill: 'var(--color-chart-3)', fontSize: 9, opacity: 0.5, position: 'insideTopRight' }}
        />

        <Bar
          dataKey="rps"
          name="Throughput"
          radius={[3, 3, 3, 3]}
          maxBarSize={18}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isUs ? 'var(--color-accent)' : 'var(--color-primary)'}
              fillOpacity={entry.isUs ? 1 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
