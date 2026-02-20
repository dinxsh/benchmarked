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
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans shadow-lg space-y-0.5">
      <p className="text-[9px] text-muted-foreground/70 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-mono tabular-nums">{entry.value}ms</span>
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
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          unit="ms"
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.3 }} />
        <Legend
          wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--font-sans)' }}
          iconType="square"
          iconSize={8}
        />
        <Bar dataKey="P50" name="P50" fill="var(--color-accent)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="P95" name="P95" fill="var(--color-chart-3)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="P99" name="P99" fill="var(--color-destructive)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
