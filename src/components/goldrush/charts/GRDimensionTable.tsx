'use client';

import { useMemo } from 'react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';
import { computeRadarDimensions } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: 'JetBrains Mono, monospace',
        fontVariantNumeric: 'tabular-nums', width: 26, textAlign: 'right' }}>
        {Math.round(value)}
      </span>
    </div>
  );
}

export function GRDimensionTable({ providers }: { providers: GRProvider[] }) {
  const rows = useMemo(() => {
    return [...providers].sort((a, b) => b.score - a.score).map((p) => ({
      provider: p, dims: computeRadarDimensions(p, providers),
    }));
  }, [providers]);

  const headers = ['Speed', 'Uptime', 'Throughput', 'Reliability', 'Coverage'];
  const dimColors: Record<string, string> = {
    Speed: C.blue, Uptime: C.green, Throughput: C.purple, Reliability: C.green, Coverage: C.amber,
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>
          Dimension Comparison
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
          All dimensions normalized 0–100
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: C.textMuted,
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Provider
              </th>
              {headers.map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: dimColors[h],
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', minWidth: 110, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
              <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 10, color: C.amber,
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ provider: p, dims }) => {
              const isGoldRush = p.name === 'GoldRush';
              return (
                <tr key={p.id} style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: isGoldRush ? 'rgba(245,197,24,0.04)' : 'transparent',
                  borderLeft: isGoldRush ? `3px solid ${C.gold}` : '3px solid transparent',
                  transition: 'background 150ms',
                }}>
                  <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: isGoldRush ? 800 : 600,
                    color: isGoldRush ? C.gold : C.textPrimary, fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap' }}>
                    {p.name}
                  </td>
                  {headers.map((h) => (
                    <td key={h} style={{ padding: '10px 12px' }}>
                      <MiniBar value={dims[h as keyof typeof dims]} color={dimColors[h]} />
                    </td>
                  ))}
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 800,
                    color: C.amber, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                    {p.score.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
