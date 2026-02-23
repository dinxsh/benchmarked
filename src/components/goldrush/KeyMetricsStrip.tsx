'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { computeWinners } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

const stripVariants = { animate: { transition: { staggerChildren: 0.06 } } };
const tileVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  valueColor?: string;
}

function MetricTile({ label, value, sub, highlight, valueColor }: TileProps) {
  return (
    <motion.div
      variants={tileVariants}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderLeft: highlight ? `3px solid ${C.blue}` : `1px solid ${C.border}`,
        borderRadius: 2, padding: '12px 14px', minWidth: 120, flex: 1,
      }}
    >
      <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: valueColor ?? C.textPrimary,
        fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}

export function KeyMetricsStrip({ providers }: { providers: GRProvider[] }) {
  const w = useMemo(() => computeWinners(providers), [providers]);
  const allPerfect = providers.filter((p) => p.errRate === 0);
  const freeProviders = providers.filter((p) => p.free);
  const byJitter = [...providers].sort((a, b) => a.jitter - b.jitter);
  const byScore  = [...providers].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      variants={stripVariants}
      initial="initial"
      animate="animate"
      style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}
    >
      <MetricTile
        label="FASTEST P50"
        value={`${Math.round(w.speed?.p50 ?? 0)}ms`}
        sub={w.speed?.name}
        valueColor={C.green}
      />
      <MetricTile
        label="BEST UPTIME"
        value={`${w.reliability?.uptime ?? 0}%`}
        sub={w.reliability?.name}
        valueColor={C.green}
      />
      <MetricTile
        label="PEAK THROUGHPUT"
        value={`${Math.round(w.throughput?.rps ?? 0)} rps`}
        sub={w.throughput?.name}
        valueColor={C.blue}
      />
      <MetricTile
        label="TOP SCORE"
        value={`${byScore[0]?.score.toFixed(1) ?? '—'}`}
        sub={byScore[0]?.name}
        valueColor={C.amber}
      />
      <MetricTile
        label="MOST CONSISTENT"
        value={`${Math.round(byJitter[0]?.jitter ?? 0)}ms`}
        sub={byJitter[0]?.name}
        valueColor={C.purple}
      />
      <MetricTile
        label="LOWEST ERROR"
        value={`${allPerfect.length > 0 ? '0%' : '—'}`}
        sub={`${allPerfect.length} provider${allPerfect.length !== 1 ? 's' : ''}`}
        valueColor={C.green}
      />
      <MetricTile
        label="BEST VALUE"
        value={w.value?.costPerM === 0 ? 'Free' : `$${w.value?.costPerM}/M`}
        sub={w.value?.name}
        highlight
        valueColor={C.blue}
      />
      <MetricTile
        label="FREE PROVIDERS"
        value={`${freeProviders.length}`}
        sub={freeProviders.map((p) => p.name).join(' · ')}
        valueColor={C.green}
      />
    </motion.div>
  );
}
