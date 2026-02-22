'use client';

import { BarChart2 } from 'lucide-react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';

const C = GR_COLORS;

export function CTABand({ leader }: { leader?: GRProvider }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${C.blue}`, borderRadius: 2,
      padding: '28px 36px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 20, fontWeight: 800, color: C.textPrimary,
        fontFamily: GR_FONTS.mono, marginBottom: 8 }}>
        <BarChart2 size={16} style={{ color: C.blue, flexShrink: 0 }} />
        {leader
          ? `${leader.name} leads — ${Math.round(leader.p50)}ms P50 median latency`
          : 'Live Solana RPC benchmark — 8 providers, updated every 30s'
        }
      </div>
      <div style={{ fontSize: 13, color: C.textSecondary, fontFamily: GR_FONTS.mono }}>
        Score = Latency 40% + Reliability 35% + Throughput 25% · Jitter = P99 − P50 · 5 samples per provider
      </div>
    </div>
  );
}
