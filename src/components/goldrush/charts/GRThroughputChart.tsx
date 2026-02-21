'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LabelList, Cell,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';

const C = GR_COLORS;

export function GRThroughputChart({ providers }: { providers: GRProvider[] }) {
  const { data, median } = useMemo(() => {
    const sorted = [...providers].sort((a, b) => b.rps - a.rps);
    const rpsVals = providers.map((p) => p.rps);
    const med = rpsVals.sort((a, b) => a - b)[Math.floor(rpsVals.length / 2)];
    return {
      data: sorted.map((p) => ({
        name: p.name, rps: Math.round(p.rps),
        mult: (p.rps / (med || 1)).toFixed(1),
        isGoldRush: p.name === 'GoldRush',
      })),
      median: med,
    };
  }, [providers]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>
          Throughput Ranking
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
          Requests per second — dashed = median
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
          <XAxis type="number" tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
            tickFormatter={(v) => `${v} rps`} />
          <YAxis type="category" dataKey="name" width={84} tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
          <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
            formatter={(v: any) => [`${v} rps`, 'Throughput']} />
          <ReferenceLine x={median} stroke={C.textMuted} strokeDasharray="4 3" label={{ value: 'median', fill: C.textMuted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
          <Bar dataKey="rps" isAnimationActive radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.isGoldRush ? C.gold : C.blue} />
            ))}
            <LabelList dataKey="mult" position="right" formatter={(v: string) => `${v}×`}
              style={{ fontSize: 11, fill: C.textSecondary, fontFamily: 'JetBrains Mono, monospace' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
