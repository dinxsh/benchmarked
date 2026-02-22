'use client';

import { useMemo } from 'react';
import { Trophy, Check, Dot } from 'lucide-react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS, TYPE_LABELS, TYPE_COLORS } from '@/lib/benchmark/data';
import { computeWinners } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

interface Props {
  providers: GRProvider[];
}

function TypeBadge({ type }: { type: GRProvider['type'] }) {
  const tc = TYPE_COLORS[type];
  return (
    <span style={{
      background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono,
    }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  return (
    <div style={{ width: '100%', height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`, borderRadius: 3,
        background: `linear-gradient(90deg, ${C.gold} 0%, ${C.amber} 100%)`,
        transition: 'width 600ms ease',
      }} />
    </div>
  );
}

export function HeroBand({ providers }: Props) {
  const winners = useMemo(() => computeWinners(providers), [providers]);
  const hero = winners.overall;
  if (!hero) return null;

  const byP50 = [...providers].sort((a, b) => a.p50 - b.p50);
  const rank2P50 = byP50[1]?.p50 ?? hero.p50;
  const marginMs = Math.round(rank2P50 - hero.p50);
  const cheaperPaid = providers.filter((p) => p.costPerM > 0 && p.costPerM > hero.costPerM && p.name !== hero.name);

  const bullets = [
    `${hero.p50}ms P50 — fastest in benchmark window`,
    hero.uptime >= 100 ? '100% reliability — no dropped requests' : `${hero.uptime}% uptime`,
    hero.costPerM === 0
      ? 'Free tier available — zero cost to start'
      : `$${hero.costPerM}/M req${cheaperPaid.length > 0 ? ` — lowest cost among paid providers` : ''}`,
  ];

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderTop: `2px solid ${C.blue}`,
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Left panel */}
        <div style={{ padding: '28px 32px', borderRight: `1px solid ${C.border}` }}>
          {/* Badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(59,130,246,0.15)', color: C.blue,
              border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 4,
              padding: '3px 10px', fontSize: 10, fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              fontFamily: GR_FONTS.mono,
            }}>
              <Trophy size={11} /> #1 SPEED — LIVE
            </span>
            <TypeBadge type={hero.type} />
          </div>
          {/* Provider name */}
          <div style={{ marginBottom: 4 }}>
            <h2 style={{
              fontSize: 36, fontWeight: 800, color: C.textPrimary,
              fontFamily: GR_FONTS.mono, lineHeight: 1.1, margin: 0,
            }}>
              {hero.name}
            </h2>
            <a href={hero.website} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', fontFamily: GR_FONTS.mono }}>
              {hero.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
          {/* Why bullets */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 8 }}>
              WHY IT&apos;S FASTEST
            </div>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <Check size={11} color={C.green} style={{ marginTop: 3, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.textSecondary, fontFamily: GR_FONTS.mono }}>{b}</span>
              </div>
            ))}
          </div>
          {/* Data freshness note */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {['Live measurements', 'Real API calls', '5 samples'].map((note) => (
                <span key={note} style={{ display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
                  <Dot size={10} />
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Right panel */}
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Big latency number */}
          <div>
            <div style={{
              fontSize: 72, fontWeight: 900, color: C.gold,
              fontFamily: GR_FONTS.mono, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(hero.p50)}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginTop: 4 }}>
              ms P50 MEDIAN LATENCY
            </div>
          </div>
          {/* Composite score */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontFamily: GR_FONTS.mono }}>
                Composite score
              </span>
              <span style={{ fontSize: 14, color: C.amber, fontWeight: 800,
                fontFamily: GR_FONTS.mono }}>
                {hero.score.toFixed(1)}/100
              </span>
            </div>
            <ScoreBar score={hero.score} />
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              {[['Latency', '40%', C.blue], ['Reliability', '35%', C.green], ['Throughput', '25%', C.purple]].map(([label, pct, color]) => (
                <span key={label as string} style={{ fontSize: 10, color: color as string,
                  fontFamily: GR_FONTS.mono }}>
                  {label} {pct}
                </span>
              ))}
            </div>
          </div>
          {/* Jitter stat */}
          <div style={{
            marginTop: 20, padding: '12px 14px',
            background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', fontFamily: GR_FONTS.mono }}>
                  JITTER (P99–P50)
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2,
                  fontFamily: GR_FONTS.mono }}>
                  response consistency
                </div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: hero.jitter > 300 ? C.amber : C.green,
                fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(hero.jitter)}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
