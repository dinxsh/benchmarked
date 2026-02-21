'use client';

import { useEffect, useState } from 'react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';

const C = GR_COLORS;

interface Props {
  providers: GRProvider[];
  secsLeft: number;
  loading: boolean;
  onRefresh: () => void;
}

export function StickyNav({ providers, secsLeft, loading, onRefresh }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const goldRush = providers.find((p) => p.name === 'GoldRush');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: `${C.bgCard}F0`, backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 300ms ease',
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', gap: 20,
    }}>
      {/* Logo */}
      <span style={{ fontSize: 14, fontWeight: 800, color: C.gold,
        fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        ⚡ GoldRush
      </span>
      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        · Solana RPC Benchmark ·
      </span>

      {/* Live dot */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block',
          animation: 'gr-pulse 2s infinite',
        }} />
        <span style={{ fontSize: 11, color: C.green, fontFamily: 'JetBrains Mono, monospace' }}>LIVE</span>
      </span>

      {/* GoldRush P50 */}
      {goldRush && (
        <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
          GoldRush: <strong style={{ color: C.gold }}>{Math.round(goldRush.p50)}ms P50</strong>
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Countdown */}
      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        next in {secsLeft}s
      </span>

      {/* Get API key CTA */}
      <a href="https://goldrush.dev" target="_blank" rel="noopener noreferrer"
        style={{ padding: '6px 14px', background: C.gold, color: '#000',
          borderRadius: 5, fontWeight: 800, fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', flexShrink: 0 }}>
        Get API Key
      </a>

      <style>{`
        @keyframes gr-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
