'use client';

import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, TYPE_LABELS, TYPE_COLORS } from '@/lib/benchmark/data';

const C = GR_COLORS;

interface Props {
  provider: GRProvider | null;
  open: boolean;
  onClose: () => void;
  allProviders: GRProvider[];
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 12px', minWidth: 72 }}>
      <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace',
        fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function CapRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <span style={{ fontSize: 14, color: value ? C.green : C.textMuted }}>{value ? '✓' : '✗'}</span>
      <span style={{ fontSize: 12, color: value ? C.textPrimary : C.textMuted,
        fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
    </div>
  );
}

export function GRProviderDrawer({ provider: p, open, onClose, allProviders }: Props) {
  // Trap focus + ESC close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!p) return null;

  const goldRush = allProviders.find((x) => x.name === 'GoldRush');
  const tc = TYPE_COLORS[p.type];

  const speedComparison = goldRush && p.name !== 'GoldRush'
    ? goldRush.p50 < p.p50
      ? `GoldRush is ${Math.round(p.p50 / goldRush.p50 * 10) / 10}× faster`
      : `GoldRush is ${Math.round(p.p50 / goldRush.p50 * 10) / 10}× slower`
    : null;

  const costComparison = goldRush && p.name !== 'GoldRush'
    ? goldRush.costPerM === 0 && p.costPerM === 0 ? 'Both free'
      : goldRush.costPerM === 0 ? 'GoldRush is free'
      : p.costPerM === 0 ? `${p.name} is free; GoldRush \$${goldRush.costPerM}/M`
      : goldRush.costPerM < p.costPerM
        ? `GoldRush is \$${(p.costPerM - goldRush.costPerM).toFixed(1)}/M cheaper`
        : `GoldRush is \$${(goldRush.costPerM - p.costPerM).toFixed(1)}/M more expensive`
    : null;

  const grCap = goldRush?.capabilities.capScore ?? 0;
  const featComparison = goldRush && p.name !== 'GoldRush'
    ? grCap > p.capabilities.capScore
      ? `GoldRush has more capabilities (${grCap}% vs ${p.capabilities.capScore}%)`
      : grCap === p.capabilities.capScore
        ? 'Same capability score'
        : `${p.name} has more capabilities (${p.capabilities.capScore}% vs ${grCap}%)`
    : null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }} />
      )}
      {/* Drawer */}
      <div
        role="dialog" aria-modal="true" aria-label={`${p.name} details`}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
          background: C.bgCard, borderLeft: `1px solid ${C.borderBright}`,
          overflowY: 'auto', zIndex: 50, padding: '24px 24px 40px',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: p.name === 'GoldRush' ? C.gold : C.textPrimary,
                fontFamily: 'JetBrains Mono, monospace' }}>
                {p.name}
              </h2>
              <span style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
                borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                {TYPE_LABELS[p.type]}
              </span>
            </div>
            <a href={p.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textMuted,
                textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
              {p.website.replace(/^https?:\/\//g, '')} <ExternalLink size={11} />
            </a>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: C.textSecondary }}>
            <X size={16} />
          </button>
        </div>

        {/* Current scores */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
            CURRENT SCORES
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <MetricChip label="P50" value={`${Math.round(p.p50)}ms`} color={p.p50 <= 20 ? C.green : p.p50 <= 100 ? C.amber : C.red} />
            <MetricChip label="P95" value={`${Math.round(p.p95)}ms`} color={p.p95 <= 300 ? C.amber : C.red} />
            <MetricChip label="P99" value={`${Math.round(p.p99)}ms`} color={p.p99 <= 300 ? C.amber : C.red} />
            <MetricChip label="Reliability" value={`${p.uptime}%`} color={p.uptime >= 99 ? C.green : p.uptime >= 95 ? C.amber : C.red} />
            <MetricChip label="Throughput" value={`${Math.round(p.rps)} rps`} color={C.blue} />
            <MetricChip label="Jitter" value={`${Math.round(p.jitter)}ms`} color={p.jitter <= 150 ? C.green : p.jitter <= 400 ? C.amber : C.red} />
          </div>
        </div>

        {/* Rankings */}
        <div style={{ marginBottom: 20, padding: '14px 16px', background: C.bgBase, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
            RANKS
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['Speed', [...allProviders].sort((a, b) => a.p50 - b.p50).findIndex((x) => x.id === p.id) + 1],
              ['Reliability', [...allProviders].sort((a, b) => b.uptime - a.uptime).findIndex((x) => x.id === p.id) + 1],
              ['Value', p.costPerM === 0 ? 1 : [...allProviders.filter(x => x.costPerM > 0)].sort((a, b) => (b.score / b.costPerM) - (a.score / a.costPerM)).findIndex((x) => x.id === p.id) + 1],
            ].map(([dim, rank]) => (
              <div key={dim as string}>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{dim}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary,
                  fontFamily: 'JetBrains Mono, monospace' }}>#{rank}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GoldRush comparison */}
        {p.name !== 'GoldRush' && goldRush && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
              HOW IT COMPARES TO GOLDRUSH
            </div>
            {[
              { icon: goldRush.p50 <= p.p50 ? '✓' : '✗', text: speedComparison },
              { icon: goldRush.costPerM <= p.costPerM ? '✓' : '✗', text: costComparison },
              { icon: grCap >= p.capabilities.capScore ? '✓' : '✗', text: featComparison },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{ color: row.icon === '✓' ? C.green : C.amber, fontSize: 14, flexShrink: 0 }}>{row.icon}</span>
                <span style={{ fontSize: 12, color: C.textSecondary, fontFamily: 'JetBrains Mono, monospace' }}>{row.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Capabilities */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
            CAPABILITIES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <CapRow label="Transactions"    value={p.capabilities.transactions} />
            <CapRow label="Event Logs"      value={p.capabilities.eventLogs} />
            <CapRow label="Token Balances"  value={p.capabilities.tokenBalances} />
            <CapRow label="NFT Metadata"    value={p.capabilities.nftMetadata} />
            <CapRow label="Custom Indexing" value={p.capabilities.customIndexing} />
            <CapRow label="Traces"          value={p.capabilities.traces} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: C.textSecondary, fontFamily: 'JetBrains Mono, monospace' }}>
            History: <span style={{ color: C.textPrimary }}>{p.capabilities.historyDepth}</span>
             · 
            Cap. Score: <span style={{ color: p.capabilities.capScore >= 80 ? C.green : p.capabilities.capScore >= 50 ? C.amber : C.red, fontWeight: 700 }}>
              {p.capabilities.capScore}%
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
            PRICING
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 3 }}>Cost / M Req</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: p.free ? C.green : C.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>
                {p.free ? 'Free' : `\$${p.costPerM}`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 3 }}>Rate Limit</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>
                {p.capabilities.rateLimit}
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="https://goldrush.dev" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '11px 16px', background: C.gold, color: '#000',
              borderRadius: 6, textAlign: 'center', fontWeight: 800, fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', display: 'block' }}>
            Try GoldRush Free →
          </a>
          <a href="https://goldrush.dev/docs" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '11px 16px', background: 'transparent',
              border: `1px solid ${C.gold}`, color: C.gold,
              borderRadius: 6, textAlign: 'center', fontWeight: 700, fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', display: 'block' }}>
            View GoldRush Docs →
          </a>
        </div>
      </div>
    </>
  );
}