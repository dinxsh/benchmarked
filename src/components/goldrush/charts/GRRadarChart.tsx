'use client';

import { useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';
import { computeRadarDimensions } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

const RADAR_COLORS = [C.gold, C.blue, C.green, C.purple, C.amber];

export function GRRadarChart({ providers }: { providers: GRProvider[] }) {
  const { top5, axes, series } = useMemo(() => {
    const top5 = [...providers].sort((a, b) => b.score - a.score).slice(0, 5);
    const axes = ['Speed', 'Uptime', 'Throughput', 'Reliability', 'Coverage'];
    const radarData = axes.map((axis) => {
      const entry: Record<string, unknown> = { axis };
      top5.forEach((p) => {
        const dims = computeRadarDimensions(p, providers);
        entry[p.name] = dims[axis as keyof typeof dims];
      });
      return entry;
    });
    return { top5, axes, series: radarData };
  }, [providers]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>
          Multi-Axis Radar
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
          Top 5 providers — Speed · Uptime · Throughput · Reliability · Coverage
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={series} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke={C.border} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
          <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
          {top5.map((p, i) => {
            const isGoldRush = p.name === 'GoldRush';
            return (
              <Radar
                key={p.id} name={p.name} dataKey={p.name}
                stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]}
                fillOpacity={isGoldRush ? 0.20 : 0.08}
                strokeWidth={isGoldRush ? 2.5 : 1.5}
                isAnimationActive
              />
            );
          })}
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
