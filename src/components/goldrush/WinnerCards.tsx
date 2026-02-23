'use client';

import { useMemo } from 'react';
import { Zap, Shield, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { computeWinners } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

const containerVariants = { animate: { transition: { staggerChildren: 0.09 } } };
const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

interface WinnerCardProps {
  icon: React.ReactNode;
  label: string;
  provider: GRProvider | undefined;
  value: string;
  accent: string;
}

function WinnerCard({ icon, label, provider, value, accent }: WinnerCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderLeft: `2px solid ${accent}`,
        borderRadius: 2,
        padding: '14px 16px',
        flex: 1,
        transition: 'border-color 200ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: `${accent}1A`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', fontFamily: GR_FONTS.mono }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary,
        fontFamily: GR_FONTS.mono, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.textSecondary, fontFamily: GR_FONTS.mono, marginTop: 4 }}>
        {provider?.name ?? '—'}
      </div>
    </motion.div>
  );
}

export function WinnerCards({ providers }: { providers: GRProvider[] }) {
  const w = useMemo(() => computeWinners(providers), [providers]);

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
    >
      <WinnerCard icon={<Zap size={13} />}        label="LOWEST LATENCY"     accent={C.green}  provider={w.speed}       value={`${Math.round(w.speed?.p50 ?? 0)}ms P50`} />
      <WinnerCard icon={<Shield size={13} />}      label="MOST RELIABLE"      accent={C.amber}  provider={w.reliability} value={`${w.reliability?.uptime ?? 0}% uptime`} />
      <WinnerCard icon={<TrendingUp size={13} />}  label="HIGHEST THROUGHPUT" accent={C.blue}   provider={w.throughput}  value={`${Math.round(w.throughput?.rps ?? 0)} rps`} />
      <WinnerCard icon={<DollarSign size={13} />}  label="BEST VALUE"         accent={C.purple} provider={w.value}       value={w.value?.costPerM === 0 ? 'Free' : `$${w.value?.costPerM}/M req`} />
    </motion.div>
  );
}
