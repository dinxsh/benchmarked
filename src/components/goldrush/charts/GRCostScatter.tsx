'use client';

import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label, Cell,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { computeValueScore } from '@/lib/benchmark/scoring';

const C = GR_COLORS;
const TT = { background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono };

export function GRCostScatter({ providers }: { providers: GRProvider[] }) {
  const { data, avgScore, maxCost, minScore, maxScore } = useMemo(() => {
    const pts = providers.map((p) => ({
      name:    p.name,
      x:       p.costPerM,   // cost per M requests
      y:       p.score,
      z:       Math.max(10, Math.min(26, p.rps * 0.55)), // bubble radius ∝ throughput
      free:    p.free,
      errRate: p.errRate,
      rps:     Math.round(p.rps),
      value:   p.free ? '∞' : `${computeValueScore(p)}`,
    }));
    const avg  = providers.reduce((s, p) => s + p.score, 0) / (providers.length || 1);
    const maxC = Math.max(...providers.map((p) => p.costPerM), 0);
    const minS = Math.min(...providers.map((p) => p.score), 0);
    const maxS = Math.max(...providers.map((p) => p.score), 100);
    return { data: pts, avgScore: Math.round(avg * 10) / 10, maxCost: maxC, minScore: minS, maxScore: maxS };
  }, [providers]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const r    = payload.z;
    const fill = payload.free ? C.green : C.blue;
    // Offset label to avoid overlap: label above for lower-score, below for higher
    const labelY = cy - r - 5;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.7} stroke={fill} strokeWidth={1.5} />
        {/* Score badge inside bubble */}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill="#fff" fontSize={9} fontFamily={GR_FONTS.mono} fontWeight={700}>
          {payload.y.toFixed(0)}
        </text>
        {/* Provider name above */}
        <text x={cx} y={labelY} textAnchor="middle"
          fill={C.textSecondary} fontSize={10} fontFamily={GR_FONTS.mono} fontWeight={600}>
          {payload.name}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ ...TT, padding: '10px 14px', fontSize: 12, minWidth: 170 }}>
        <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
          {d.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>Cost / M req</span>
          <strong style={{ color: d.free ? C.green : C.textPrimary }}>{d.free ? 'Free' : `$${d.x}`}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>Score</span>
          <strong style={{ color: C.amber }}>{d.y.toFixed(1)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>Throughput</span>
          <strong style={{ color: C.blue }}>{d.rps} rps</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ color: C.textMuted }}>Value (score/$)</span>
          <strong style={{ color: d.free ? C.green : C.textSecondary }}>{d.value}</strong>
        </div>
        {d.errRate > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 4, borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>
            <span style={{ color: C.textMuted }}>Error rate</span>
            <strong style={{ color: C.red }}>{d.errRate.toFixed(1)}%</strong>
          </div>
        )}
      </div>
    );
  };

  const xDomain: [number, number] = [-0.15, Math.max(maxCost * 1.25, 0.5)];
  const yDomain: [number, number] = [Math.max(0, minScore - 5), Math.min(100, maxScore + 5)];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Cost vs Performance
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
          Bubble size = throughput · score inside bubble · upper-left = best value
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 28, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis type="number" dataKey="x" domain={xDomain}
            tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono }}
            tickFormatter={(v) => v <= 0 ? 'Free' : `$${v}`}>
            <Label value="Cost / M Requests (USD)" position="insideBottom" offset={-14}
              style={{ fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono }} />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={yDomain}
            tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono }}>
            <Label value="Score" angle={-90} position="insideLeft" offset={8}
              style={{ fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          {/* Free tier vertical guide */}
          <ReferenceLine x={0} stroke={C.green} strokeDasharray="4 3" strokeOpacity={0.6}
            label={{ value: 'Free', fill: C.green, fontSize: 10, fontFamily: GR_FONTS.mono, position: 'insideTopLeft' }} />
          {/* Avg score horizontal guide */}
          <ReferenceLine y={avgScore} stroke={C.textMuted} strokeDasharray="4 3"
            label={{ value: `avg ${avgScore}`, fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono, position: 'insideTopRight' }} />
          <Scatter data={data} shape={<CustomDot />} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
        {[['Free tier', C.green], ['Paid tier', C.blue]].map(([label, color]) => (
          <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
          number inside bubble = score
        </span>
      </div>
    </div>
  );
}
