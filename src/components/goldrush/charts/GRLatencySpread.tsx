'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, ReferenceLine,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;
const TICK = { fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono };
const TT   = { background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono };

function jitterColor(ms: number): string {
  if (ms <= 150) return C.green;
  if (ms <= 400) return C.amber;
  return C.red;
}

export function GRLatencySpread({ providers }: { providers: GRProvider[] }) {
  const { data, avgJitter, bestJitter } = useMemo(() => {
    // Sort by jitter ascending: most stable first (leftmost)
    const sorted = [...providers].sort((a, b) => a.jitter - b.jitter);
    const avg = Math.round(providers.reduce((s, p) => s + p.jitter, 0) / (providers.length || 1));
    return {
      data: sorted.map((p) => ({
        name:   p.name,
        p50:    p.p50,
        p95ext: Math.max(0, p.p95 - p.p50),
        p99ext: Math.max(0, p.p99 - p.p95),
        jitter: p.jitter,
        p99:    p.p99,
        jitterLabel: `${Math.round(p.jitter)}ms`,
      })),
      avgJitter: avg,
      bestJitter: sorted[0],
    };
  }, [providers]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ ...TT, padding: '10px 14px', fontSize: 12, minWidth: 170 }}>
        <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
          {label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>P50</span><strong style={{ color: C.blue }}>{d.p50}ms</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>P95</span><strong style={{ color: C.amber }}>{d.p50 + d.p95ext}ms</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>P99</span><strong style={{ color: C.red }}>{d.p99}ms</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 6, borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
          <span style={{ color: C.textMuted }}>Jitter</span>
          <strong style={{ color: jitterColor(d.jitter) }}>{Math.round(d.jitter)}ms</strong>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
            Latency Spread
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
            P50 → P95 → P99 stacked — sorted most stable → highest variance
          </div>
        </div>
        {bestJitter && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best Jitter</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: GR_FONTS.mono }}>
              {Math.round(bestJitter.jitter)}ms — {bestJitter.name}
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="name" tick={TICK} />
          <YAxis tick={TICK} tickFormatter={(v) => `${v}ms`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine y={avgJitter} stroke={C.textMuted} strokeDasharray="4 3"
            label={{ value: `avg jitter ${avgJitter}ms`, position: 'insideTopRight', fill: C.textMuted, fontSize: 9, fontFamily: GR_FONTS.mono }} />

          <Bar dataKey="p50" stackId="s" name="P50" isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={C.blue} />)}
          </Bar>
          <Bar dataKey="p95ext" stackId="s" name="+P95" fill={C.amber} fillOpacity={0.8} isAnimationActive={false} />
          <Bar dataKey="p99ext" stackId="s" name="+P99" fill={C.red} fillOpacity={0.5} radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {/* Jitter annotation on top of each bar */}
            <LabelList
              dataKey="jitterLabel"
              position="top"
              style={{ fontSize: 10, fill: C.textSecondary, fontFamily: GR_FONTS.mono }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
        {[['P50', C.blue], ['+P95 range', C.amber], ['+P99 tail', C.red]].map(([label, color]) => (
          <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color as string, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
          label = jitter (P99−P50)
        </span>
      </div>
    </div>
  );
}
