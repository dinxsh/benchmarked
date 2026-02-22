'use client';

import { useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { computeRadarDimensions } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

const RADAR_COLORS = [C.blue, C.green, C.purple, C.amber, C.red];

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
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Multi-Axis Radar
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
          Top 5 providers — Speed · Uptime · Throughput · Reliability · Coverage
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={series} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke={C.border} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono }} />
          <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono, fontSize: 12 }} />
          {top5.map((p, i) => (
            <Radar
              key={p.id} name={p.name} dataKey={p.name}
              stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]}
              fillOpacity={0.10}
              strokeWidth={1.5}
              isAnimationActive
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: GR_FONTS.mono, paddingTop: 8 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
