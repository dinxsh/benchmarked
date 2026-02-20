'use client';

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p50Val = payload.find((p: any) => p.dataKey === 'p50')?.value ?? 0;
  const p95Delta = payload.find((p: any) => p.dataKey === 'p95_delta')?.value ?? 0;
  const p99Delta = payload.find((p: any) => p.dataKey === 'p99_delta')?.value ?? 0;
  const p95Val = p50Val + p95Delta;
  const p99Val = p95Val + p99Delta;

  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-lg px-3.5 py-3 text-xs shadow-lg min-w-[140px]">
      <p className="text-[10px] font-semibold text-foreground mb-2.5 pb-2 border-b border-border/40">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
            P50
          </span>
          <span className="font-mono tabular-nums font-medium" style={{ color: 'var(--color-accent)' }}>{p50Val}ms</span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: 'var(--color-chart-3)' }} />
            P95
          </span>
          <span className="font-mono tabular-nums font-medium" style={{ color: 'var(--color-chart-3)' }}>{p95Val}ms</span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: 'var(--color-destructive)' }} />
            P99
          </span>
          <span className="font-mono tabular-nums font-medium" style={{ color: 'var(--color-destructive)' }}>{p99Val}ms</span>
        </div>
      </div>
    </div>
  );
};

const LegendRenderer = ({ payload }: any) => {
  const labels: Record<string, string> = { p50: 'P50 median', p95_delta: '+P95 range', p99_delta: '+P99 tail' };
  if (!payload) return null;
  return (
    <div className="flex items-center gap-5 justify-center pt-3">
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
          <span className="text-[10px] font-sans text-muted-foreground">{labels[entry.dataKey] ?? entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function SolanaLatencyChart({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50);

  const data = sorted.map(p => ({
    name: p.name,
    p50: p.metrics.latency_p50,
    p95_delta: Math.max(0, p.metrics.latency_p95 - p.metrics.latency_p50),
    p99_delta: Math.max(0, p.metrics.latency_p99 - p.metrics.latency_p95),
    isUs: p.is_us,
  }));

  const chartHeight = Math.max(220, sorted.length * 36 + 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <ComposedChart
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
          unit="ms"
          tickCount={6}
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

        {/* Reference: "fast" threshold */}
        <ReferenceLine
          x={100}
          stroke="var(--color-accent)"
          strokeOpacity={0.25}
          strokeDasharray="4 4"
          label={{ value: '100ms', fill: 'var(--color-accent)', fontSize: 9, opacity: 0.5, position: 'insideTopRight' }}
        />
        {/* Reference: "acceptable" threshold */}
        <ReferenceLine
          x={300}
          stroke="var(--color-chart-3)"
          strokeOpacity={0.25}
          strokeDasharray="4 4"
          label={{ value: '300ms', fill: 'var(--color-chart-3)', fontSize: 9, opacity: 0.5, position: 'insideTopRight' }}
        />

        <Bar
          dataKey="p50"
          name="P50"
          fill="var(--color-accent)"
          stackId="latency"
          radius={[3, 0, 0, 3]}
          maxBarSize={18}
        />
        <Bar
          dataKey="p95_delta"
          name="P95 range"
          fill="var(--color-chart-3)"
          stackId="latency"
          fillOpacity={0.80}
          maxBarSize={18}
        />
        <Bar
          dataKey="p99_delta"
          name="P99 tail"
          fill="var(--color-destructive)"
          stackId="latency"
          fillOpacity={0.70}
          radius={[0, 3, 3, 0]}
          maxBarSize={18}
        />

        <Legend content={<LegendRenderer />} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
