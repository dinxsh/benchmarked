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
    <div className="bg-background border border-border rounded p-2 text-[11px] font-mono shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p style={{ color: 'hsl(var(--accent))' }}>{payload[0].value} req/s</p>
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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          unit=" rps"
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
        <Bar dataKey="rps" name="Throughput" radius={[0, 2, 2, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isUs ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
