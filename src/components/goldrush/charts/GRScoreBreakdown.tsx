'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;

export function GRScoreBreakdown({ providers }: { providers: GRProvider[] }) {
  const data = useMemo(() => {
    return [...providers].sort((a, b) => b.score - a.score).map((p) => {
      const latency     = Math.max(0, (1 - p.p50 / 2000)) * 100 * 0.40;
      const reliability = p.uptime * 0.35;
      const throughput  = Math.min(100, (p.rps / 200) * 100) * 0.25;
      return {
        name: p.name, latency: Math.round(latency * 10) / 10,
        reliability: Math.round(reliability * 10) / 10,
        throughput: Math.round(throughput * 10) / 10,
        total: p.score,
      };
    });
  }, [providers]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Score Breakdown
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
          Latency 40% · Reliability 35% · Throughput 25%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 50, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
          <XAxis type="number" domain={[0, 100]}
            tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: GR_FONTS.mono }} />
          <YAxis type="category" dataKey="name" width={84}
            tick={(props: any) => {
              const { x, y, payload } = props;
              return <text x={x} y={y} dy={4} textAnchor="end" fill={C.textSecondary} fontSize={11} fontFamily={GR_FONTS.mono}>{payload.value}</text>;
            }} />
          <Tooltip
            contentStyle={{ background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 2, fontFamily: GR_FONTS.mono, fontSize: 12, color: C.textPrimary }}
            labelStyle={{ color: C.textPrimary, fontWeight: 700 }}
            itemStyle={{ color: C.textSecondary }} />
          <Bar dataKey="latency"     stackId="s" name="Latency"     fill={C.blue}   isAnimationActive />
          <Bar dataKey="reliability" stackId="s" name="Reliability" fill={C.green}  isAnimationActive />
          <Bar dataKey="throughput"  stackId="s" name="Throughput"  fill={C.purple} isAnimationActive radius={[0, 2, 2, 0]}>
            <LabelList dataKey="total" position="right" formatter={(v: number) => v.toFixed(1)}
              style={{ fontSize: 11, fill: C.amber, fontFamily: GR_FONTS.mono, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 92 }}>
        {[['Latency 40%', C.blue], ['Reliability 35%', C.green], ['Throughput 25%', C.purple]].map(([label, color]) => (
          <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textSecondary, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color as string, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
