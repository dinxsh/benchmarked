'use client';

import { GR_COLORS } from '@/lib/benchmark/data';

const C = GR_COLORS;

export function CTABand() {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${C.gold}`, borderRadius: 8,
      padding: '36px 40px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary,
        fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
        ⚡ GoldRush is the fastest paid Solana RPC.
      </div>
      <div style={{ fontSize: 14, color: C.textSecondary, fontFamily: 'JetBrains Mono, monospace', marginBottom: 28 }}>
        Proven live, right now — not a marketing claim.
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="https://goldrush.dev" target="_blank" rel="noopener noreferrer"
          style={{ padding: '12px 28px', background: C.gold, color: '#000',
            borderRadius: 6, fontWeight: 800, fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', display: 'inline-block' }}>
          Get Free API Key →
        </a>
        <a href="https://goldrush.dev/docs" target="_blank" rel="noopener noreferrer"
          style={{ padding: '12px 28px', background: 'transparent',
            border: `1px solid ${C.gold}`, color: C.gold,
            borderRadius: 6, fontWeight: 700, fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', display: 'inline-block' }}>
          View Docs →
        </a>
        <a href="mailto:sales@goldrush.dev"
          style={{ padding: '12px 28px', background: 'transparent',
            border: `1px solid ${C.border}`, color: C.textSecondary,
            borderRadius: 6, fontWeight: 700, fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', display: 'inline-block' }}>
          Talk to Sales →
        </a>
      </div>
    </div>
  );
}