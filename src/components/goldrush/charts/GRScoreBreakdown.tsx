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

function scoreColor(v: number): string {
  if (v >= 80) return C.green;
  if (v >= 60) return C.amber;
  return C.red;
}

export function GRScoreBreakdown({ providers }: { providers: GRProvider[] }) {
  const data = useMemo(() => {
    return [...providers].sort((a, b) => b.score - a.score).map((p) => {
      const latency     = Math.max(0, (1 - p.p50 / 2000)) * 100 * 0.40;
      const reliability = p.uptime * 0.35;
      const throughput  = Math.min(100, (p.rps / 200) * 100) * 0.25;
      return {
        name:        p.name,
        latency:     Math.round(latency * 10) / 10,
        reliability: Math.round(reliability * 10) / 10,
        throughput:  Math.round(throughput * 10) / 10,
        total:       p.score,
        // Raw metric labels for tooltip
        p50:     p.p50,
        uptime:  p.uptime,
        rps:     Math.round(p.rps),
      };
    });
  }, [providers]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ ...TT, padding: '10px 14px', fontSize: 12, minWidth: 190 }}>
        <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
          {d.name} — <span style={{ color: scoreColor(d.total) }}>{d.total.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.blue }}>Latency 40%</span>
          <strong style={{ color: C.blue }}>{d.latency.toFixed(1)} pts · {d.p50}ms P50</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.green }}>Reliability 35%</span>
          <strong style={{ color: C.green }}>{d.reliability.toFixed(1)} pts · {d.uptime.toFixed(1)}% up</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ color: C.purple }}>Throughput 25%</span>
          <strong style={{ color: C.purple }}>{d.throughput.toFixed(1)} pts · {d.rps} rps</strong>
        </div>
      </div>
    );
  };

  // Custom label renderer for per-bar colored score
  const ScoreLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === undefined) return null;
    const color = scoreColor(value);
    return (
      <text
        x={x + width + 5}
        y={y + height / 2}
        dy={4}
        fill={color}
        fontSize={11}
        fontFamily={GR_FONTS.mono}
        fontWeight={800}
      >
        {value.toFixed(1)}
      </text>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Score Breakdown
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 52, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={TICK} />
          <YAxis type="category" dataKey="name" width={84} tick={TICK} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={70} stroke={C.textMuted} strokeDasharray="4 3" strokeOpacity={0.6}
            label={{ value: '70', position: 'insideTopRight', fill: C.textMuted, fontSize: 9, fontFamily: GR_FONTS.mono }} />

          <Bar dataKey="latency"     stackId="s" name="Latency"     fill={C.blue}   isAnimationActive={false} />
          <Bar dataKey="reliability" stackId="s" name="Reliability" fill={C.green}  isAnimationActive={false} />
          <Bar dataKey="throughput"  stackId="s" name="Throughput"  fill={C.purple} radius={[0, 2, 2, 0]} isAnimationActive={false}>
            <LabelList dataKey="total" content={<ScoreLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 92 }}>
        {[['Latency 40%', C.blue], ['Reliability 35%', C.green], ['Throughput 25%', C.purple]].map(([label, color]) => (
          <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color as string, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
