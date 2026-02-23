'use client';

import { useMemo } from 'react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;

export function GRUptimeList({ providers }: { providers: GRProvider[] }) {
  const sorted = useMemo(() => [...providers].sort((a, b) => (a.rank || 0) - (b.rank || 0)), [providers]);

  function uptimeColor(pct: number): string {
    if (pct >= 99) return C.green;
    if (pct >= 80) return C.amber;
    return C.red;
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
          Uptime / Reliability
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
          Ranked by composite score · green ≥99% · amber ≥80%
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((p, i) => {
          const color = uptimeColor(p.uptime);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.textMuted, fontFamily: GR_FONTS.mono,
                width: 20, textAlign: 'right', flexShrink: 0 }}>
                #{i + 1}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600,
                color: C.textPrimary,
                fontFamily: GR_FONTS.mono, width: 90, flexShrink: 0 }}>
                {p.name}
              </span>
              <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.uptime}%`, background: color, borderRadius: 4,
                  transition: 'width 600ms ease' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: GR_FONTS.mono,
                fontVariantNumeric: 'tabular-nums', width: 48, textAlign: 'right', flexShrink: 0 }}>
                {p.uptime.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
