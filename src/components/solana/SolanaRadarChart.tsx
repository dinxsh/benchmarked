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

// Muted, professional palette — no neon
const COLORS = [
  '#60a5fa',  // blue
  '#34d399',  // emerald (muted)
  '#f59e0b',  // amber
  '#a78bfa',  // violet
  '#fb7185',  // rose
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

const AXES = ['Speed', 'Uptime', 'Throughput', 'Reliability', 'Coverage'];

export function SolanaRadarChart({ providers, showLegend = true, height = 340 }: Props) {
  // Limit to top 5 by score to keep the chart readable
  const top5 = [...providers]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const data = AXES.map(axis => {
    const entry: Record<string, any> = { axis };
    top5.forEach(p => {
      if (axis === 'Speed') {
        entry[p.name] = Math.max(0, 100 - Math.round(p.metrics.latency_p50 / 20));
      } else if (axis === 'Uptime') {
        entry[p.name] = Math.round(p.metrics.uptime_percent);
      } else if (axis === 'Throughput') {
        entry[p.name] = Math.min(100, Math.round((p.metrics.throughput_rps / 200) * 100));
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
      <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans shadow-lg space-y-0.5">
        <p className="text-xs text-muted-foreground/70 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.dataKey}: <span className="font-mono tabular-nums">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="var(--color-border)" strokeOpacity={0.35} />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 11, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        {top5.map((p, i) => (
          <Radar
            key={p.id}
            name={p.name}
            dataKey={p.name}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.06}
            strokeWidth={1.5}
          />
        ))}
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}
            iconType="circle"
            iconSize={7}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
