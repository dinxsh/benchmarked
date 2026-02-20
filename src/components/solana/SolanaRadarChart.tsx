'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
  showLegend?: boolean;
  height?: number;
}

// Fixed color palette cycling for providers
const COLORS = [
  'var(--chart-1)',   /* violet  */
  'var(--chart-2)',   /* cyan    */
  'var(--chart-3)',   /* amber   */
  'var(--chart-4)',   /* pink    */
  'var(--chart-5)',   /* emerald */
  'var(--accent)',    /* violet  (6th provider fallback) */
  'var(--chart-2)',   /* cyan    (7th provider fallback) */
  'var(--chart-4)',   /* pink    (8th provider fallback) */
];

function capabilityScore(p: SolanaProvider): number {
  const caps = p.capabilities;
  const score =
    (caps.transactions ? 1 : 0) +
    (caps.logs ? 1 : 0) +
    (caps.token_balances ? 1 : 0) +
    (caps.nft_metadata ? 1 : 0) +
    (caps.traces ? 1 : 0) +
    (caps.custom_indexing ? 1 : 0);
  return Math.round((score / 6) * 100);
}

function normalize(value: number, max: number): number {
  return Math.round(Math.min(100, Math.max(0, (value / max) * 100)));
}

const AXES = ['Speed', 'Uptime', 'Throughput', 'Reliability', 'Coverage'];

export function SolanaRadarChart({ providers, showLegend = true, height = 340 }: Props) {
  const data = AXES.map(axis => {
    const entry: Record<string, any> = { axis };
    providers.forEach(p => {
      if (axis === 'Speed') {
        // Invert latency: 0ms = 100, 1000ms = 0
        entry[p.name] = Math.max(0, 100 - Math.round(p.metrics.latency_p50 / 10));
      } else if (axis === 'Uptime') {
        entry[p.name] = Math.round(p.metrics.uptime_percent);
      } else if (axis === 'Throughput') {
        entry[p.name] = normalize(p.metrics.throughput_rps, 500);
      } else if (axis === 'Reliability') {
        entry[p.name] = Math.round(100 - p.metrics.error_rate);
      } else if (axis === 'Coverage') {
        entry[p.name] = capabilityScore(p);
      }
    });
    return entry;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border border-border p-2 text-[10px] font-mono space-y-0.5 shadow">
        <p className="text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.dataKey}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip content={<CustomTooltip />} />
        {providers.map((p, i) => (
          <Radar
            key={p.id}
            name={p.name}
            dataKey={p.name}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.08}
            strokeWidth={1.5}
          />
        ))}
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }}
            iconType="circle"
            iconSize={6}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
