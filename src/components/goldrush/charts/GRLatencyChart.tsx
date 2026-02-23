'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell, ReferenceLine,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;
const TICK = { fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono };
const TT   = { background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono };

export function GRLatencyChart({ providers }: { providers: GRProvider[] }) {
  const { data, minP50 } = useMemo(() => {
    const sorted  = [...providers].sort((a, b) => a.p50 - b.p50); // fastest first
    const min     = sorted[0]?.p50 ?? 0;
    return {
      data: sorted.map((p) => {
        const delta = Math.round(p.p50 - min);
        return {
          name:      p.name,
          p50:       p.p50,
          p95ext:    Math.max(0, p.p95 - p.p50),
          p99ext:    Math.max(0, p.p99 - p.p95),
          jitter:    p.jitter,
          delta,
          // Label shown right of outermost bar
          tag: delta === 0 ? `${p.p50}ms ★` : `${p.p50}ms +${delta}`,
        };
      }),
      minP50: min,
    };
  }, [providers]);

  const maxVal = Math.max(...providers.map((p) => p.p99), 100);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const rows: [string, string, string][] = [
      ['P50', `${d.p50}ms`, C.blue],
      ['P95', `${d.p50 + d.p95ext}ms`, C.amber],
      ['P99', `${d.p50 + d.p95ext + d.p99ext}ms`, C.red],
      ['Jitter', `${Math.round(d.jitter)}ms`, C.purple],
    ];
    return (
      <div style={{ ...TT, padding: '10px 14px', fontSize: 12, minWidth: 160 }}>
        <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
          {d.name}
        </div>
        {rows.map(([label, val, color]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, color, marginBottom: 3 }}>
            <span style={{ color: C.textMuted }}>{label}</span>
            <strong>{val}</strong>
          </div>
        ))}
        {d.delta > 0 && (
          <div style={{ color: C.textMuted, marginTop: 6, borderTop: `1px solid ${C.border}`, paddingTop: 6, fontSize: 11 }}>
            +{d.delta}ms slower than fastest
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
            Latency Distribution
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
            P50 · P95 range · P99 tail — sorted fastest → slowest
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best P50</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.green, fontFamily: GR_FONTS.mono }}>{minP50}ms</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 100, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
          <XAxis type="number" domain={[0, maxVal * 1.08]} tick={TICK} tickFormatter={(v) => `${v}ms`} />
          <YAxis type="category" dataKey="name" width={84} tick={TICK} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={minP50} stroke={C.green} strokeDasharray="4 3" strokeOpacity={0.5} />

          <Bar dataKey="p50" stackId="lat" name="P50" isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={C.blue} />)}
          </Bar>
          <Bar dataKey="p95ext" stackId="lat" fill={C.amber} fillOpacity={0.8} name="+P95" isAnimationActive={false} />
          <Bar dataKey="p99ext" stackId="lat" fill={C.red} fillOpacity={0.5} name="+P99" radius={[0, 2, 2, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="tag"
              position="right"
              style={{ fontSize: 10, fill: C.textSecondary, fontFamily: GR_FONTS.mono }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 92 }}>
        {[['P50 median', C.blue], ['+P95 range', C.amber], ['+P99 tail', C.red], ['Jitter (tooltip)', C.purple]].map(([label, color]) => (
          <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color as string, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
