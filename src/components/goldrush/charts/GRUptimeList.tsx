'use client';

import { useMemo } from 'react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;

function uptimeColor(pct: number): string {
  if (pct >= 99) return C.green;
  if (pct >= 95) return C.amber;
  return C.red;
}
function errColor(rate: number): string {
  if (rate === 0) return C.green;
  if (rate < 1)   return C.amber;
  return C.red;
}

export function GRUptimeList({ providers }: { providers: GRProvider[] }) {
  // Sort best uptime first
  const sorted = useMemo(
    () => [...providers].sort((a, b) => b.uptime - a.uptime || a.errRate - b.errRate),
    [providers],
  );

  const bestUptime = sorted[0]?.uptime ?? 100;

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
            Uptime &amp; Error Rate
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 2 }}>
            Sorted best → worst · green ≥99% · amber ≥95%
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.green, fontFamily: GR_FONTS.mono }}>{bestUptime.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((p, i) => {
          const uc = uptimeColor(p.uptime);
          const ec = errColor(p.errRate);
          return (
            <div key={p.id}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                {/* Rank */}
                <span style={{
                  fontSize: 11, color: i === 0 ? C.green : C.textMuted,
                  fontFamily: GR_FONTS.mono, width: 20, textAlign: 'right', flexShrink: 0,
                  fontWeight: i === 0 ? 800 : 400,
                }}>
                  #{i + 1}
                </span>
                {/* Name */}
                <span style={{
                  fontSize: 12, fontWeight: 700, color: uc,
                  fontFamily: GR_FONTS.mono, width: 88, flexShrink: 0,
                }}>
                  {p.name}
                </span>
                {/* Uptime % */}
                <span style={{
                  fontSize: 13, fontWeight: 800, color: uc,
                  fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums',
                  width: 50, textAlign: 'right', flexShrink: 0,
                }}>
                  {p.uptime.toFixed(2)}%
                </span>
                {/* Err rate */}
                <span style={{
                  fontSize: 11, color: ec,
                  fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums',
                  width: 58, textAlign: 'right', flexShrink: 0,
                }}>
                  {p.errRate === 0 ? '0 err' : `${p.errRate.toFixed(1)}% err`}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ marginLeft: 30, display: 'flex', gap: 6, alignItems: 'center' }}>
                {/* Uptime bar */}
                <div style={{ flex: 3, height: 8, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${p.uptime}%`, background: uc, borderRadius: 4,
                    transition: 'width 600ms ease',
                  }} />
                </div>
                {/* Err rate micro-bar */}
                <div style={{
                  flex: 1, height: 8, background: C.border, borderRadius: 4, overflow: 'hidden',
                  opacity: p.errRate === 0 ? 0.3 : 1,
                }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, p.errRate * 10)}%`,
                    background: ec, borderRadius: 4,
                  }} />
                </div>
                <span style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, flexShrink: 0, width: 28, textAlign: 'right' }}>
                  err
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
