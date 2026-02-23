'use client';

import { useMemo } from 'react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { computeRadarDimensions } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

const DIM_COLORS: Record<string, string> = {
  Speed: C.blue, Uptime: C.green, Throughput: C.purple, Reliability: C.green, Coverage: C.amber,
};

const RANK_COLORS = ['#f2cc0c', '#9fa7b3', '#f5a623', C.border, C.border, C.border];

function rankBorder(rank: number): string {
  return RANK_COLORS[rank - 1] ?? C.border;
}

function scoreColor(v: number): string {
  if (v >= 80) return C.green;
  if (v >= 60) return C.amber;
  return C.red;
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 7, background: C.border, borderRadius: 3, overflow: 'hidden', minWidth: 44 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 500ms ease' }} />
      </div>
      <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums', width: 30, textAlign: 'right' }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function GRDimensionTable({ providers }: { providers: GRProvider[] }) {
  const rows = useMemo(() => {
    return [...providers].sort((a, b) => b.score - a.score).map((p, i) => ({
      rank: i + 1,
      provider: p,
      dims: computeRadarDimensions(p, providers),
    }));
  }, [providers]);

  const headers = ['Speed', 'Uptime', 'Throughput', 'Reliability', 'Coverage'] as const;

  const thBase: React.CSSProperties = {
    padding: '9px 10px', fontSize: 10, fontFamily: GR_FONTS.mono,
    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Dimension Comparison
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
          All dimensions normalized 0–100 · sorted by composite score · gold/silver/bronze borders
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bgBase }}>
              <th style={{ ...thBase, textAlign: 'center', color: C.textMuted, width: 36 }}>#</th>
              <th style={{ ...thBase, textAlign: 'left', color: C.textMuted, minWidth: 90 }}>Provider</th>
              {headers.map((h) => (
                <th key={h} style={{ ...thBase, textAlign: 'left', color: DIM_COLORS[h], minWidth: 120 }}>{h}</th>
              ))}
              <th style={{ ...thBase, textAlign: 'right', color: C.amber, width: 64 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rank, provider: p, dims }) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${rankBorder(rank)}`,
                  background: 'transparent',
                  transition: 'background 120ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = C.bgCardHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                }}
              >
                {/* Rank */}
                <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                  <span style={{
                    fontSize: 11, fontWeight: rank <= 3 ? 800 : 400,
                    color: rankBorder(rank),
                    fontFamily: GR_FONTS.mono,
                  }}>
                    {rank}
                  </span>
                </td>
                {/* Name */}
                <td style={{ padding: '9px 10px', fontSize: 12, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono, whiteSpace: 'nowrap' }}>
                  {p.name}
                </td>
                {/* Dimension bars */}
                {headers.map((h) => (
                  <td key={h} style={{ padding: '9px 10px' }}>
                    <MiniBar value={dims[h]} color={DIM_COLORS[h]} />
                  </td>
                ))}
                {/* Total score */}
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(p.score) }}>
                    {p.score.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
