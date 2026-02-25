'use client';

import { useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { computeWinners } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

const stripVariants = { animate: { transition: { staggerChildren: 0.07 } } };
const tileVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
};

// Animated number counter — counts from 0 to target when mounted
function AnimatedValue({
  value, decimals = 0, suffix = '',
}: {
  value: number; decimals?: number; suffix?: string;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v: number) => v.toFixed(decimals) + suffix);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.1, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, count]);

  return (
    <motion.span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </motion.span>
  );
}

interface TileProps {
  label: string;
  rawValue: number;
  decimals?: number;
  suffix?: string;
  sub?: string;
  highlight?: boolean;
  valueColor?: string;
  freeText?: string; // when value is "Free" instead of a number
}

function MetricTile({ label, rawValue, decimals, suffix, sub, highlight, valueColor, freeText }: TileProps) {
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
      <div style={{
        fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, color: valueColor ?? C.textPrimary,
        fontFamily: GR_FONTS.mono, lineHeight: 1,
      }}>
        {freeText ? (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{freeText}</span>
        ) : (
          <AnimatedValue value={rawValue} decimals={decimals} suffix={suffix} />
        )}
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
        rawValue={Math.round(w.speed?.p50 ?? 0)}
        suffix="ms"
        sub={w.speed?.name}
        valueColor={C.green}
      />
      <MetricTile
        label="BEST UPTIME"
        rawValue={w.reliability?.uptime ?? 0}
        suffix="%"
        sub={w.reliability?.name}
        valueColor={C.green}
      />
      <MetricTile
        label="PEAK THROUGHPUT"
        rawValue={Math.round(w.throughput?.rps ?? 0)}
        suffix=" rps"
        sub={w.throughput?.name}
        valueColor={C.blue}
      />
      <MetricTile
        label="TOP SCORE"
        rawValue={byScore[0]?.score ?? 0}
        decimals={1}
        sub={byScore[0]?.name}
        valueColor={C.amber}
      />
      <MetricTile
        label="MOST CONSISTENT"
        rawValue={Math.round(byJitter[0]?.jitter ?? 0)}
        suffix="ms"
        sub={byJitter[0]?.name}
        valueColor={C.purple}
      />
      <MetricTile
        label="LOWEST ERROR"
        rawValue={0}
        suffix="%"
        freeText={allPerfect.length === 0 ? '—' : undefined}
        sub={`${allPerfect.length} provider${allPerfect.length !== 1 ? 's' : ''}`}
        valueColor={C.green}
      />
      <MetricTile
        label="BEST VALUE"
        rawValue={w.value?.costPerM ?? 0}
        decimals={1}
        freeText={w.value?.costPerM === 0 ? 'Free' : undefined}
        suffix={w.value?.costPerM !== 0 ? '/M' : undefined}
        sub={w.value?.name}
        highlight
        valueColor={C.blue}
      />
      <MetricTile
        label="FREE PROVIDERS"
        rawValue={freeProviders.length}
        sub={freeProviders.map((p) => p.name).join(' · ')}
        valueColor={C.green}
      />
    </motion.div>
  );
}
