'use client';

import { useMemo } from 'react';
import { Trophy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS, TYPE_LABELS, TYPE_COLORS } from '@/lib/benchmark/data';
import { computeWinners } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

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
  return (
    <div style={{ width: '100%', height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, score)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${C.gold} 0%, ${C.amber} 100%)` }}
      />
    </div>
  );
}

export function HeroBand({ providers }: { providers: GRProvider[] }) {
  const winners = useMemo(() => computeWinners(providers), [providers]);
  const hero = winners.overall;
  if (!hero) return null;

  const byP50 = [...providers].sort((a, b) => a.p50 - b.p50);
  const cheaperPaid = providers.filter((p) => p.costPerM > 0 && p.costPerM > hero.costPerM && p.name !== hero.name);

  const bullets = [
    `${hero.p50}ms P50 · server-to-server · US-East`,
    hero.uptime >= 100 ? '100% uptime — zero dropped requests' : `${hero.uptime.toFixed(0)}% uptime in this window`,
    hero.costPerM === 0
      ? 'Free tier — zero cost to start'
      : `$${hero.costPerM}/M req${cheaperPaid.length > 0 ? ' — lowest cost among paid providers' : ''}`,
  ];

  const margin = byP50[1] ? Math.round((byP50[1]?.p50 ?? hero.p50) - hero.p50) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.blue}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

        {/* Left panel */}
        <div style={{ padding: '32px 36px', borderRight: `1px solid ${C.border}` }}>
          {/* Badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(59,130,246,0.15)', color: C.blue,
              border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 4,
              padding: '3px 10px', fontSize: 10, fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono,
            }}>
              <Trophy size={11} /> #1 OVERALL — LIVE
            </span>
            <TypeBadge type={hero.type} />
          </div>

          {/* Provider name — very bold */}
          <div style={{ marginBottom: 4 }}>
            <h2 style={{
              fontSize: 48, fontWeight: 900, color: C.textPrimary,
              fontFamily: GR_FONTS.mono, lineHeight: 1.0, margin: 0,
              letterSpacing: '-0.03em',
            }}>
              {hero.name}
            </h2>
            <a href={hero.website} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', fontFamily: GR_FONTS.mono }}>
              {hero.website.replace(/^https?:\/\//, '')}
            </a>
          </div>

          {/* Why bullets */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 10 }}>
              WHY IT WINS
            </div>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <Check size={11} color={C.green} style={{ marginTop: 3, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.textSecondary, fontFamily: GR_FONTS.mono }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Big latency number */}
          <div>
            <div style={{
              fontSize: 96, fontWeight: 900, color: C.gold,
              fontFamily: GR_FONTS.mono, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(hero.p50)}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginTop: 4 }}>
              ms P50 · server-to-server · US-East
            </div>
            {margin > 0 && (
              <div style={{ fontSize: 12, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 6 }}>
                <span style={{ color: C.green, fontWeight: 700 }}>{margin}ms</span> faster than #2
              </div>
            )}
          </div>

          {/* Composite score */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono }}>
                Composite Score
              </span>
              <span style={{ fontSize: 16, color: C.amber, fontWeight: 900, fontFamily: GR_FONTS.mono }}>
                {hero.score.toFixed(1)}/100
              </span>
            </div>
            <ScoreBar score={hero.score} />
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              {([['Latency', '40%', C.blue], ['Reliability', '35%', C.green], ['Throughput', '25%', C.purple]] as const).map(([label, pct, color]) => (
                <span key={label} style={{ fontSize: 10, color, fontFamily: GR_FONTS.mono }}>{label} {pct}</span>
              ))}
            </div>
          </div>

          {/* P99 consistency stat */}
          <div style={{ marginTop: 20, padding: '12px 14px', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono }}>
                P99 TAIL LATENCY
              </span>
              <span style={{ fontSize: 22, fontWeight: 900, color: hero.p99 > 500 ? C.amber : C.green, fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(hero.p99)}ms
              </span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
