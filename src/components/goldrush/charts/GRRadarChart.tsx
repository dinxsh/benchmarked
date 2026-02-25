'use client';

import { useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { computeRadarDimensions } from '@/lib/benchmark/scoring';

const C = GR_COLORS;
const RADAR_COLORS = [C.blue, C.green, C.purple, C.amber, C.red];
const TT = { background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono };

export function GRRadarChart({ providers }: { providers: GRProvider[] }) {
  const { top5, series } = useMemo(() => {
    const top5   = [...providers].sort((a, b) => b.score - a.score).slice(0, 5);
    const axes   = ['Speed', 'Uptime', 'Throughput', 'Reliability', 'Coverage'];
    const series = axes.map((axis) => {
      const entry: Record<string, unknown> = { axis };
      top5.forEach((p) => {
        const dims   = computeRadarDimensions(p, providers);
        entry[p.name] = dims[axis as keyof typeof dims];
      });
      return entry;
    });
    return { top5, series };
  }, [providers]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ ...TT, padding: '10px 14px', fontSize: 12, minWidth: 160 }}>
        <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
          {label}
        </div>
        {payload.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
            <span style={{ color: item.color }}>{item.name}</span>
            <strong style={{ color: item.color }}>{item.value}</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Multi-Axis Radar
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={series} cx="50%" cy="50%" outerRadius="78%">
          <PolarGrid stroke={C.border} />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: C.textMuted, fontSize: 9, fontFamily: GR_FONTS.mono }}
            stroke="none"
            tickFormatter={(v) => v === 0 ? '' : String(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          {top5.map((p, i) => (
            <Radar
              key={p.id}
              name={p.name}
              dataKey={p.name}
              stroke={RADAR_COLORS[i]}
              fill={RADAR_COLORS[i]}
              fillOpacity={0.12}
              strokeWidth={2}
              isAnimationActive={false}
              dot={{ r: 3, fill: RADAR_COLORS[i], strokeWidth: 0 }}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10, justifyContent: 'center' }}>
        {top5.map((p, i) => (
          <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: RADAR_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: RADAR_COLORS[i], fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: C.textMuted }}>{p.score.toFixed(1)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
