'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded p-2 text-[11px] font-mono shadow-md">
      <p className="font-medium mb-1 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}ms
        </p>
      ))}
    </div>
  );
};

export function SolanaLatencyChart({ providers }: Props) {
  const data = providers.map(p => ({
    name: p.name,
    P50: p.metrics.latency_p50,
    P95: p.metrics.latency_p95,
    P99: p.metrics.latency_p99,
    isUs: p.is_us,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
        barCategoryGap="25%"
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          unit="ms"
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
        <Legend
          wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
          iconType="square"
          iconSize={8}
        />
        <Bar dataKey="P50" name="P50" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
        <Bar dataKey="P95" name="P95" fill="var(--chart-3)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="P99" name="P99" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
