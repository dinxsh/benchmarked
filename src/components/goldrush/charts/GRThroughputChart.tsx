'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList, Cell,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;
const TICK = { fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono };
const TT   = { background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono };

function tierColor(rps: number, best: number): string {
  const pct = rps / best;
  if (pct >= 0.85) return C.green;
  if (pct >= 0.55) return C.blue;
  if (pct >= 0.30) return C.amber;
  return C.red;
}

export function GRThroughputChart({ providers }: { providers: GRProvider[] }) {
  const { data, median, best } = useMemo(() => {
    const sorted = [...providers].sort((a, b) => b.rps - a.rps); // best first
    const rpsVals = sorted.map((p) => p.rps);
    const mid = rpsVals[Math.floor(rpsVals.length / 2)] ?? 0;
    const top = sorted[0]?.rps ?? 1;
    return {
      data: sorted.map((p) => ({
        name:  p.name,
        rps:   Math.round(p.rps),
        slot:  p.slot,
        errRate: p.errRate,
        tag:   `${Math.round(p.rps)} rps`,
        color: tierColor(p.rps, top),
      })),
      median: Math.round(mid),
      best:   Math.round(top),
    };
  }, [providers]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ ...TT, padding: '10px 14px', fontSize: 12, minWidth: 170 }}>
        <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
          {d.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>Throughput</span>
          <strong style={{ color: C.blue }}>{d.rps} rps</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>vs best</span>
          <strong style={{ color: C.textSecondary }}>{d.rps === best ? '★ leader' : `${Math.round((d.rps / best) * 100)}%`}</strong>
        </div>
        {d.errRate > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
            <span style={{ color: C.textMuted }}>Err rate</span>
            <strong style={{ color: C.red }}>{d.errRate.toFixed(1)}%</strong>
          </div>
        )}
        {d.slot && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 4, borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>
            <span style={{ color: C.textMuted }}>Slot</span>
            <strong style={{ color: C.textSecondary }}>{(d.slot / 1e6).toFixed(1)}M</strong>
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
            Throughput Ranking
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best RPS</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.green, fontFamily: GR_FONTS.mono }}>{best}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
          <XAxis type="number" tick={TICK} tickFormatter={(v) => `${v}`}
            label={{ value: 'req/s', position: 'insideBottomRight', offset: -4, style: { fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono } }} />
          <YAxis type="category" dataKey="name" width={84} tick={TICK} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={median} stroke={C.textMuted} strokeDasharray="4 3"
            label={{ value: `med ${median}`, position: 'insideTopRight', fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono }} />
          <Bar dataKey="rps" isAnimationActive={false} radius={[0, 2, 2, 0]}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="tag" position="right"
              style={{ fontSize: 10, fill: C.textSecondary, fontFamily: GR_FONTS.mono }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 92 }}>
        {[['≥85% best', C.green], ['55–84%', C.blue], ['30–54%', C.amber], ['<30%', C.red]].map(([label, color]) => (
          <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color as string, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
