'use client';

import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label, Cell,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;

export function GRCostScatter({ providers }: { providers: GRProvider[] }) {
  const { data, avgScore } = useMemo(() => {
    const pts = providers.map((p) => ({
      name: p.name, x: p.costPerM, y: p.score,
      z: Math.max(8, Math.min(24, p.rps * 0.5)),
      free: p.free,
    }));
    const avg = providers.reduce((s, p) => s + p.score, 0) / providers.length;
    return { data: pts, avgScore: Math.round(avg * 10) / 10 };
  }, [providers]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const r = payload.z;
    const fill = payload.free ? C.green : C.blue;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.8} stroke={fill} strokeWidth={1.5} />
        <text x={cx} y={cy - r - 4} textAnchor="middle" fill={C.textSecondary}
          fontSize={10} fontFamily={GR_FONTS.mono} fontWeight={400}>
          {payload.name}
        </text>
      </g>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Cost vs Performance
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
          Bubble size = throughput · upper-left = best value
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 24, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis type="number" dataKey="x" name="Cost/M" domain={[-0.1, 2.5]}
            tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono }}
            tickFormatter={(v) => v === 0 ? 'Free' : `$${v}`}>
            <Label value="Cost / M Requests (USD)" position="insideBottom" offset={-12}
              style={{ fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono }} />
          </XAxis>
          <YAxis type="number" dataKey="y" name="Score" domain={[50, 100]}
            tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono }}>
            <Label value="Score" angle={-90} position="insideLeft"
              style={{ fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono }} />
          </YAxis>
          <Tooltip
            contentStyle={{ background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono, fontSize: 12, color: C.textPrimary }}
            labelStyle={{ color: C.textPrimary, fontWeight: 700 }}
            itemStyle={{ color: C.textSecondary }}
            formatter={(v: any, name: string) => [name === 'Cost/M' ? (v === 0 ? 'Free' : `$${v}`) : v.toFixed(1), name]} />
          <ReferenceLine x={0} stroke={C.green} strokeDasharray="4 3"
            label={{ value: 'Free', fill: C.green, fontSize: 10, fontFamily: GR_FONTS.mono }} />
          <ReferenceLine y={avgScore} stroke={C.textMuted} strokeDasharray="4 3"
            label={{ value: `avg ${avgScore}`, fill: C.textMuted, fontSize: 10, fontFamily: GR_FONTS.mono, position: 'right' }} />
          <Scatter data={data} shape={<CustomDot />} isAnimationActive />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
