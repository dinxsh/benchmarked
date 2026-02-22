'use client';

import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS, TYPE_LABELS, TYPE_COLORS } from '@/lib/benchmark/data';

const C = GR_COLORS;

interface Props {
  provider: GRProvider | null;
  open: boolean;
  onClose: () => void;
  allProviders: GRProvider[];
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 2, padding: '8px 12px', minWidth: 72 }}>
      <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: GR_FONTS.mono,
        fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function CapRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <span style={{ fontSize: 14, color: value ? C.green : C.textMuted }}>{value ? '✓' : '✗'}</span>
      <span style={{ fontSize: 12, color: value ? C.textPrimary : C.textMuted,
        fontFamily: GR_FONTS.mono }}>{label}</span>
    </div>
  );
}

export function GRProviderDrawer({ provider: p, open, onClose, allProviders }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!p) return null;

  const tc = TYPE_COLORS[p.type];

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
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.textPrimary,
                fontFamily: GR_FONTS.mono }}>
                {p.name}
              </h2>
              <span style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
                borderRadius: 2, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono }}>
                {TYPE_LABELS[p.type]}
              </span>
            </div>
            <a href={p.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textMuted,
                textDecoration: 'none', fontFamily: GR_FONTS.mono }}>
              {p.website.replace(/^https?:\/\//g, '')} <ExternalLink size={11} />
            </a>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 2, padding: '6px 8px', cursor: 'pointer', color: C.textSecondary }}>
            <X size={16} />
          </button>
        </div>

        {/* Current scores */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 12 }}>
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
        <div style={{ marginBottom: 20, padding: '14px 16px', background: C.bgBase, borderRadius: 2 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 10 }}>
            RANKS
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['Speed', [...allProviders].sort((a, b) => a.p50 - b.p50).findIndex((x) => x.id === p.id) + 1],
              ['Reliability', [...allProviders].sort((a, b) => b.uptime - a.uptime).findIndex((x) => x.id === p.id) + 1],
              ['Value', p.costPerM === 0 ? 1 : [...allProviders.filter(x => x.costPerM > 0)].sort((a, b) => (b.score / b.costPerM) - (a.score / a.costPerM)).findIndex((x) => x.id === p.id) + 1],
            ].map(([dim, rank]) => (
              <div key={dim as string}>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{dim}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary,
                  fontFamily: GR_FONTS.mono }}>#{rank}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 10 }}>
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
          <div style={{ marginTop: 8, fontSize: 12, color: C.textSecondary, fontFamily: GR_FONTS.mono }}>
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
            textTransform: 'uppercase', fontFamily: GR_FONTS.mono, marginBottom: 10 }}>
            PRICING
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, marginBottom: 3 }}>Cost / M Req</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: p.free ? C.green : C.textPrimary, fontFamily: GR_FONTS.mono }}>
                {p.free ? 'Free' : `\$${p.costPerM}`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, marginBottom: 3 }}>Rate Limit</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
                {p.capabilities.rateLimit}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <a href={p.website} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '11px 16px', background: C.blue, color: '#fff',
            borderRadius: 2, fontWeight: 700, fontSize: 13,
            fontFamily: GR_FONTS.mono, textDecoration: 'none' }}>
          Visit {p.name} <ExternalLink size={13} />
        </a>
      </div>
    </>
  );
}
