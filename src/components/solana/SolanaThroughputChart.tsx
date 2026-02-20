'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-[11px] font-mono shadow-lg space-y-0.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p style={{ color: 'var(--color-accent)' }}>{payload[0].value} req/s</p>
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

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, left: 0, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          unit=" rps"
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.3 }} />
        <Bar dataKey="rps" name="Throughput" radius={[0, 2, 2, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isUs ? 'var(--color-accent)' : 'var(--color-primary)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
