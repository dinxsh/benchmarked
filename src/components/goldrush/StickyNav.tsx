'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Loader2 } from 'lucide-react';
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

  const leader = providers.length > 0
    ? providers.reduce((a, b) => a.p50 < b.p50 ? a : b)
    : null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: `${C.bgCard}F2`, backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 280ms ease',
      padding: '9px 24px',
      display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Activity size={14} style={{ color: C.blue }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary,
          fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
          Solana RPC Benchmark
        </span>
      </div>

      <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block',
          animation: 'gr-pulse 2s infinite',
        }} />
        <span style={{ fontSize: 11, color: C.green, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>LIVE</span>
      </span>

      {leader && (
        <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
          #1&nbsp;<strong style={{ color: C.textPrimary }}>{leader.name}</strong>&nbsp;—&nbsp;{Math.round(leader.p50)}ms P50
        </span>
      )}

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        next in {secsLeft}s
      </span>

      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
          border: `1px solid ${C.borderBright}`, background: 'transparent',
          color: C.textSecondary, fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif',
          transition: 'border-color 150ms', flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderBright; }}
      >
        {loading
          ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
          : <RefreshCw size={11} />
        }
        Refresh
      </button>

      <style>{`
        @keyframes gr-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
