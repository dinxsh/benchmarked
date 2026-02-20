'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p50    = payload.find(e => e.dataKey === 'p50')?.value ?? 0;
  const p95gap = payload.find(e => e.dataKey === 'p95diff')?.value ?? 0;
  const p99gap = payload.find(e => e.dataKey === 'p99diff')?.value ?? 0;
  const p95    = p50 + p95gap;
  const p99    = p95 + p99gap;
  const spread = p99 - p50;
  return (
    <div className="border border-border bg-popover rounded px-3 py-2 text-[11px] font-mono space-y-1">
      <p className="font-bold text-foreground mb-1">{label}</p>
      <p><span className="text-chart-1">P50: </span><span className="tabular-nums">{p50}ms</span></p>
      <p><span className="text-chart-3">P95: </span><span className="tabular-nums">{p95}ms</span></p>
      <p><span className="text-chart-4">P99: </span><span className="tabular-nums">{p99}ms</span></p>
      <p className="border-t border-border/50 pt-1 text-muted-foreground">Spread P99−P50: <span className="text-foreground tabular-nums">{spread}ms</span></p>
    </div>
  );
}

export function SolanaLatencySpreadChart({ providers }: Props) {
  const data = [...providers]
    .sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50)
    .map(p => ({
      name:    p.name,
      p50:     p.metrics.latency_p50,
      p95diff: p.metrics.latency_p95 - p.metrics.latency_p50,
      p99diff: p.metrics.latency_p99 - p.metrics.latency_p95,
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: 0, bottom: 32 }}
        barSize={20}
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}ms`}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }} />
        <Bar dataKey="p50"     stackId="l" fill="var(--color-chart-1)" name="P50"       radius={[0, 0, 2, 2]} />
        <Bar dataKey="p95diff" stackId="l" fill="var(--color-chart-3)" name="P50→P95" />
        <Bar dataKey="p99diff" stackId="l" fill="var(--color-chart-4)" name="P95→P99"  radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
