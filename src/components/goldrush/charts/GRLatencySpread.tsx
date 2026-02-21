'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';

const C = GR_COLORS;

export function GRLatencySpread({ providers }: { providers: GRProvider[] }) {
  const { data, bestJitter } = useMemo(() => {
    const byJitter = [...providers].sort((a, b) => a.jitter - b.jitter);
    const sorted   = [...providers].sort((a, b) => a.p50 - b.p50);
    return {
      data: sorted.map((p) => ({
        name: p.name,
        p50:    p.p50,
        p95ext: Math.max(0, p.p95 - p.p50),
        p99ext: Math.max(0, p.p99 - p.p95),
        jitter: p.jitter,
        isGoldRush: p.name === 'GoldRush',
      })),
      bestJitter: byJitter[0],
    };
  }, [providers]);

  const goldRush = providers.find((p) => p.name === 'GoldRush');

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>
            Latency Spread
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
            P50 → P95 → P99 stacked — tall cap = high variance
          </div>
        </div>
        {bestJitter && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
              BEST JITTER
            </div>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              {Math.round(bestJitter.jitter)}ms — {bestJitter.name}
            </div>
          </div>
        )}
      </div>
      {goldRush && (
        <div style={{ marginBottom: 10, fontSize: 11, color: C.amber, fontFamily: 'JetBrains Mono, monospace' }}>
          GoldRush jitter: {Math.round(goldRush.jitter)}ms
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: C.textSecondary, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
          <YAxis tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
            tickFormatter={(v) => `${v}ms`} />
          <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.borderBright}`, borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
            formatter={(v: any, name: string) => [`${v}ms`, name]} />
          <Bar dataKey="p50" stackId="s" name="P50" isAnimationActive>
            {data.map((d) => <Cell key={d.name} fill={d.isGoldRush ? C.gold : C.blue} />)}
          </Bar>
          <Bar dataKey="p95ext" stackId="s" name="P95 ext" fill={C.amber} fillOpacity={0.8} isAnimationActive />
          <Bar dataKey="p99ext" stackId="s" name="P99 ext" fill={C.red} fillOpacity={0.4} isAnimationActive radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
        {[['P50', C.blue], ['P95 extension', C.amber], ['P99 tail', C.red]].map(([label, color]) => (
          <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
            color: C.textSecondary, fontFamily: 'JetBrains Mono, monospace' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color as string, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
