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

function computeComponents(p: SolanaProvider) {
  return {
    name: p.name,
    latency:    +(Math.max(0, 100 - (p.metrics.latency_p50 / 1000) * 100) * 0.35).toFixed(1),
    uptime:     +(p.metrics.uptime_percent * 0.35).toFixed(1),
    throughput: +(Math.min(100, (p.metrics.throughput_rps / 500) * 100) * 0.30).toFixed(1),
  };
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
  name: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const latency    = payload.find(e => e.dataKey === 'latency')?.value ?? 0;
  const uptime     = payload.find(e => e.dataKey === 'uptime')?.value ?? 0;
  const throughput = payload.find(e => e.dataKey === 'throughput')?.value ?? 0;
  const total      = +(latency + uptime + throughput).toFixed(1);
  return (
    <div className="border border-border bg-popover rounded px-3 py-2 text-[11px] font-mono space-y-1">
      <p className="font-bold text-foreground mb-1">{label}</p>
      <p><span className="text-chart-1">Latency (35%):    </span><span className="tabular-nums">{latency.toFixed(1)}</span></p>
      <p><span className="text-chart-5">Uptime (35%):     </span><span className="tabular-nums">{uptime.toFixed(1)}</span></p>
      <p><span className="text-chart-2">Throughput (30%): </span><span className="tabular-nums">{throughput.toFixed(1)}</span></p>
      <p className="border-t border-border/50 pt-1 font-bold text-foreground">Total: {total}</p>
    </div>
  );
}

export function SolanaScoreBreakdownChart({ providers }: Props) {
  const data = [...providers]
    .map(computeComponents)
    .sort((a, b) => (b.latency + b.uptime + b.throughput) - (a.latency + a.uptime + a.throughput));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        barSize={14}
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={72}
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }} />
        <Bar dataKey="latency"    stackId="s" fill="var(--color-chart-1)" name="Latency" />
        <Bar dataKey="uptime"     stackId="s" fill="var(--color-chart-5)" name="Uptime" />
        <Bar dataKey="throughput" stackId="s" fill="var(--color-chart-2)" name="Throughput" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
