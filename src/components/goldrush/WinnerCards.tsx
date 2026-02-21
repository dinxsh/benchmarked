'use client';

import { useMemo } from 'react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';
import { computeWinners } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

interface WinnerCardProps {
  icon: string;
  label: string;
  provider: GRProvider | undefined;
  value: string;
  highlight?: boolean;
}

function WinnerCard({ icon, label, provider, value, highlight }: WinnerCardProps) {
  const isGoldRush = provider?.name === 'GoldRush';
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${highlight ? 'rgba(245,197,24,0.4)' : C.border}`,
      borderTop: `2px solid ${highlight ? C.gold : C.border}`,
      borderRadius: 8, padding: '16px 18px', flex: 1,
      transition: 'border-color 200ms',
    }}>
      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: isGoldRush ? C.gold : C.textPrimary,
        fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.1 }}>
        {provider?.name ?? '—'}
      </div>
      <div style={{ fontSize: 13, color: C.green, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
        marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

export function WinnerCards({ providers }: { providers: GRProvider[] }) {
  const w = useMemo(() => computeWinners(providers), [providers]);
  const goldRush = providers.find((p) => p.name === 'GoldRush');

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <WinnerCard icon="⚡" label="LOWEST LATENCY"     provider={w.speed}       value={`${Math.round(w.speed?.p50 ?? 0)}ms P50`}  />
      <WinnerCard icon="🛡" label="MOST RELIABLE"      provider={w.reliability} value={`${w.reliability?.uptime ?? 0}% uptime`} />
      <WinnerCard icon="🚀" label="HIGHEST THROUGHPUT" provider={w.throughput}  value={`${Math.round(w.throughput?.rps ?? 0)}  rps`} />
      <WinnerCard
        icon="$"  label="BEST VALUE"
        provider={w.value}
        value={w.value?.costPerM === 0 ? 'Free' : `$${w.value?.costPerM}/M req`}
        highlight={w.value?.name === 'GoldRush'}
      />
    </div>
  );
}