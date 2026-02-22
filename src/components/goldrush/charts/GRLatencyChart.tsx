'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;

const CHART_STYLE = {
  cartesianGrid: { strokeDasharray: '3 3', stroke: C.border },
  axis: { fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono },
  tooltip: { background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono },
};

export function GRLatencyChart({ providers }: { providers: GRProvider[] }) {
  const data = useMemo(() => {
    const sorted = [...providers].sort((a, b) => a.p50 - b.p50);
    const fastest = sorted[0];
    return sorted.map((p) => ({
      name: p.name,
      type: p.type,
      p50: p.p50,
      p95ext: Math.max(0, p.p95 - p.p50),
      p99ext: Math.max(0, p.p99 - p.p95),
      delta: p.p50 - (fastest?.p50 ?? p.p50),
    }));
  }, [providers]);

  const maxVal = Math.max(...providers.map((p) => p.p99), 100);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ ...CHART_STYLE.tooltip, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 6 }}>{d.name}</div>
        <div style={{ color: C.blue }}>P50: <strong>{d.p50}ms</strong></div>
        <div style={{ color: C.amber }}>P95: <strong>{d.p50 + d.p95ext}ms</strong></div>
        <div style={{ color: C.red }}>P99: <strong>{d.p50 + d.p95ext + d.p99ext}ms</strong></div>
        {d.delta > 0 && <div style={{ color: C.textMuted, marginTop: 4 }}>+{Math.round(d.delta)}ms vs fastest</div>}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Latency Distribution
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
          P50 · P95 range · P99 tail — horizontal, fastest first
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
          <CartesianGrid {...CHART_STYLE.cartesianGrid} horizontal={false} />
          <XAxis type="number" domain={[0, maxVal * 1.05]} tick={CHART_STYLE.axis}
            tickFormatter={(v) => `${v}ms`} />
          <YAxis type="category" dataKey="name" width={84} tick={CHART_STYLE.axis} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="p50" stackId="lat" isAnimationActive name="P50 median">
            {data.map((d) => (
              <Cell key={d.name} fill={C.blue} />
            ))}
            <LabelList dataKey="p50" position="insideLeft" formatter={(v: number) => v <= 5 ? '' : `${v}ms`}
              style={{ fontSize: 10, fill: '#000', fontFamily: GR_FONTS.mono, fontWeight: 700 }} />
          </Bar>
          <Bar dataKey="p95ext" stackId="lat" fill={C.amber} fillOpacity={0.75} isAnimationActive name="+P95 range">
            <LabelList dataKey="delta" position="right"
              formatter={(v: number) => v > 0 ? `+${Math.round(v)}ms` : '#1'}
              style={{ fontSize: 10, fill: C.textSecondary, fontFamily: GR_FONTS.mono }} />
          </Bar>
          <Bar dataKey="p99ext" stackId="lat" fill={C.red} fillOpacity={0.45} isAnimationActive name="+P99 tail" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 92 }}>
        {[['P50 median', C.blue], ['+P95 range', C.amber], ['+P99 tail', C.red]].map(([label, color]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
            color: C.textSecondary, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
