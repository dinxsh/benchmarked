'use client';

import { useState } from 'react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, TYPE_LABELS, TYPE_COLORS } from '@/lib/benchmark/data';

const C = GR_COLORS;

interface Props { providers: GRProvider[] }

const BOOL_FEATURES: { key: keyof GRProvider['capabilities']; label: string }[] = [
  { key: 'transactions',    label: 'Transactions' },
  { key: 'eventLogs',       label: 'Event Logs' },
  { key: 'tokenBalances',   label: 'Token Balances' },
  { key: 'nftMetadata',     label: 'NFT Metadata' },
  { key: 'customIndexing',  label: 'Custom Indexing' },
  { key: 'traces',          label: 'Traces' },
];

export function GRCapabilityMatrix({ providers }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>
          Feature Capabilities
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
          Capability Matrix · providers as columns, features as rows
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: C.textMuted,
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', position: 'sticky', left: 0, background: C.bgCard,
                minWidth: 160, whiteSpace: 'nowrap' }}>
                Feature
              </th>
              {providers.map((p) => {
                const tc = TYPE_COLORS[p.type];
                const isGoldRush = p.name === 'GoldRush';
                return (
                  <th key={p.id} style={{ textAlign: 'center', padding: '12px 8px',
                    minWidth: 110, background: isGoldRush ? 'rgba(245,197,24,0.06)' : 'transparent' }}>
                    <div style={{ fontSize: 13, fontWeight: 800,
                      color: isGoldRush ? C.gold : C.textPrimary,
                      fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                      {p.name}
                    </div>
                    <span style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
                      borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                      {TYPE_LABELS[p.type]}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Provider Type row */}
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: hoveredRow === 'type' ? C.bgCardHover : 'transparent' }}
              onMouseEnter={() => setHoveredRow('type')} onMouseLeave={() => setHoveredRow(null)}>
              <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: C.textSecondary,
                fontFamily: 'JetBrains Mono, monospace', position: 'sticky', left: 0, background: hoveredRow === 'type' ? C.bgCardHover : C.bgCard,
                whiteSpace: 'nowrap' }}>
                Provider Type
              </td>
              {providers.map((p) => {
                const tc = TYPE_COLORS[p.type];
                const isGoldRush = p.name === 'GoldRush';
                return (
                  <td key={p.id} style={{ textAlign: 'center', padding: '10px 8px',
                    background: isGoldRush ? 'rgba(245,197,24,0.04)' : 'transparent' }}>
                    <span style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
                      borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                      {TYPE_LABELS[p.type]}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Boolean feature rows */}
            {BOOL_FEATURES.map(({ key, label }) => (
              <tr key={key} style={{ borderBottom: `1px solid ${C.border}`, background: hoveredRow === key ? C.bgCardHover : 'transparent' }}
                onMouseEnter={() => setHoveredRow(key)} onMouseLeave={() => setHoveredRow(null)}>
                <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: C.textSecondary,
                  fontFamily: 'JetBrains Mono, monospace', position: 'sticky', left: 0,
                  background: hoveredRow === key ? C.bgCardHover : C.bgCard, whiteSpace: 'nowrap' }}>
                  {label}
                </td>
                {providers.map((p) => {
                  const val = p.capabilities[key] as boolean;
                  const isGoldRush = p.name === 'GoldRush';
                  return (
                    <td key={p.id} style={{ textAlign: 'center', padding: '10px 8px',
                      background: isGoldRush ? 'rgba(245,197,24,0.04)' : 'transparent' }}>
                      <span style={{
                        display: 'inline-flex', width: 28, height: 28,
                        alignItems: 'center', justifyContent: 'center', borderRadius: 6,
                        background: val ? 'rgba(0,212,160,0.12)' : 'rgba(255,255,255,0.04)',
                        color: val ? C.green : C.textMuted, fontSize: 13, fontWeight: 700,
                      }}>
                        {val ? '✓' : '✗'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Text rows: History Depth, Cost/M, Rate Limit */}
            {[
              { key: 'historyDepth', label: 'History Depth', get: (p: GRProvider) => p.capabilities.historyDepth },
              { key: 'costPerM',     label: 'Cost / M Req',  get: (p: GRProvider) => p.capabilities.costPerM,
                colorFn: (v: string) => v === 'Free' ? C.green : C.textPrimary },
              { key: 'rateLimit',    label: 'Rate Limit',    get: (p: GRProvider) => p.capabilities.rateLimit },
            ].map(({ key, label, get, colorFn }) => (
              <tr key={key} style={{ borderBottom: `1px solid ${C.border}`, background: hoveredRow === key ? C.bgCardHover : 'transparent' }}
                onMouseEnter={() => setHoveredRow(key)} onMouseLeave={() => setHoveredRow(null)}>
                <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: C.textSecondary,
                  fontFamily: 'JetBrains Mono, monospace', position: 'sticky', left: 0,
                  background: hoveredRow === key ? C.bgCardHover : C.bgCard, whiteSpace: 'nowrap' }}>
                  {label}
                </td>
                {providers.map((p) => {
                  const val = get(p);
                  const isGoldRush = p.name === 'GoldRush';
                  return (
                    <td key={p.id} style={{ textAlign: 'center', padding: '10px 8px', fontSize: 12, fontWeight: 600,
                      color: colorFn ? colorFn(val) : C.textPrimary,
                      fontFamily: 'JetBrains Mono, monospace',
                      background: isGoldRush ? 'rgba(245,197,24,0.04)' : 'transparent' }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Cap Score row */}
            <tr style={{ borderTop: `2px solid ${C.border}`, background: hoveredRow === 'capScore' ? C.bgCardHover : C.bgBase }}
              onMouseEnter={() => setHoveredRow('capScore')} onMouseLeave={() => setHoveredRow(null)}>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: C.textPrimary,
                fontFamily: 'JetBrains Mono, monospace', position: 'sticky', left: 0,
                background: hoveredRow === 'capScore' ? C.bgCardHover : C.bgBase, whiteSpace: 'nowrap' }}>
                Cap. Score
              </td>
              {providers.map((p) => {
                const pct = p.capabilities.capScore;
                const color = pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red;
                const isGoldRush = p.name === 'GoldRush';
                return (
                  <td key={p.id} style={{ textAlign: 'center', padding: '12px 8px',
                    background: isGoldRush ? 'rgba(245,197,24,0.06)' : 'transparent' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 56, height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textMuted,
        fontFamily: 'JetBrains Mono, monospace' }}>
        REST and Data API providers measured differently from JSON-RPC — see methodology for details.
      </div>
    </div>
  );
}