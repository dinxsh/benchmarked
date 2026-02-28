'use client';

import React, { useState } from 'react';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import {
  useCoinGeckoStream,
  useGoldRushStream,
  useMoralisStream,
  useBitqueryStream,
  type ProviderStreamState,
  type ConnType,
} from '@/hooks/useProviderStream';
import { TOKEN_PAIRS, DEFAULT_PAIR, type TokenPair } from '@/lib/pairs';

// ─── Design tokens ────────────────────────────────────────────────────────────
const DX = {
  bg:          '#1a1a1a',
  bgDeep:      '#111111',
  surface:     '#222222',
  surfaceHover:'#2a2a2a',
  fg:          '#f2f2f2',
  fgMuted:     '#888888',
  border:      '#444444',
  borderLight: '#2a2a2a',
  accent:      '#00d084',
  destructive: '#e74c3c',
  warning:     '#f59e0b',
  mono:        '"JetBrains Mono","Fira Code","Consolas",monospace',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUptime(s: number): string {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(17,17,17,0.82)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: 30, height: 30,
        border: '3px solid rgba(255,255,255,0.08)',
        borderTopColor: 'rgba(255,255,255,0.4)',
        borderRadius: '50%',
        animation: 'dx-spin 0.7s linear infinite',
      }} />
    </div>
  );
}

function ErrorBody({ message }: { message: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '0 16px', textAlign: 'center',
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke={DX.destructive} strokeWidth="1.2" opacity={0.5}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9"  x2="12"   y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span style={{
        fontSize: 10, color: DX.destructive, fontFamily: DX.mono,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        lineHeight: 1.6, maxWidth: 240, wordBreak: 'break-word',
      }}>
        {message}
      </span>
    </div>
  );
}

// ─── Panel config ─────────────────────────────────────────────────────────────
interface PanelConfig {
  name:        string;
  connType:    ConnType;
  requiresKey: boolean;
}

const PANEL_CONFIGS: PanelConfig[] = [
  { name: 'CoinGecko', connType: 'REST', requiresKey: false },
  { name: 'GoldRush',  connType: 'WSS',  requiresKey: true  },
  { name: 'Moralis',   connType: 'REST', requiresKey: true  },
  { name: 'Bitquery',  connType: 'WSS',  requiresKey: true  },
];

// ─── StreamPanel ──────────────────────────────────────────────────────────────
function StreamPanel({ config, state }: { config: PanelConfig; state: ProviderStreamState }) {
  const { candles, status, metrics, label, error } = state;
  const { firstLatency, updatesPerMin, uptimeSeconds, totalUpdates } = metrics;

  const isConnecting = status === 'connecting';
  const isStreaming  = status === 'streaming';
  const isError      = status === 'error';
  const showSpinner  = (status === 'idle' || isConnecting) && candles.length === 0;

  const dotBg   = isConnecting ? DX.warning : isStreaming ? DX.accent : isError ? DX.destructive : '#333';
  const dotAnim = isConnecting || isStreaming ? 'dx-pulse 1.2s ease-in-out infinite' : 'none';
  const latColor =
    firstLatency === null ? DX.fgMuted :
    firstLatency < 400   ? DX.accent  :
    firstLatency < 900   ? DX.warning : DX.destructive;

  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column',
      background: DX.bgDeep, border: `1px solid ${DX.border}`,
      overflow: 'hidden', minHeight: 0,
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: `1px solid ${DX.borderLight}`,
        background: DX.bg, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: DX.fg,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {config.name}
          </span>
          <span style={{
            fontSize: 9,
            color: config.connType === 'WSS' ? DX.accent : DX.fgMuted,
            background: DX.surface, padding: '1px 5px', borderRadius: 3,
          }}>
            {config.connType}
          </span>
          {config.requiresKey
            ? <span style={{ fontSize: 9, color: '#4a4a4a' }}>★ key</span>
            : <span style={{ fontSize: 9, color: DX.accent }}>free</span>
          }
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {label && (
            <span style={{
              fontSize: 9, color: DX.fgMuted,
              background: DX.surface, padding: '1px 5px', borderRadius: 3,
            }}>
              {label}
            </span>
          )}
          {isStreaming && (
            <span style={{
              fontSize: 9, color: DX.accent, fontFamily: DX.mono,
              fontWeight: 700, letterSpacing: '0.06em',
            }}>
              LIVE
            </span>
          )}
          {isConnecting && (
            <span style={{ fontSize: 9, color: DX.warning, fontFamily: DX.mono }}>
              connecting…
            </span>
          )}
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
            background: dotBg, animation: dotAnim,
          }} />
        </div>
      </div>

      {/* ── Metrics bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '3px 12px', borderBottom: `1px solid ${DX.borderLight}`,
        background: DX.surface, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 9, color: DX.fgMuted, fontFamily: DX.mono }}>
          {config.connType}
        </span>
        <span style={{ fontSize: 9, fontFamily: DX.mono, color: latColor }}>
          ⚡{firstLatency !== null ? `${firstLatency}ms` : '—'}
        </span>
        <span style={{ fontSize: 9, fontFamily: DX.mono, color: DX.fgMuted }}>
          ↑{updatesPerMin}/m
        </span>
        <span style={{ fontSize: 9, fontFamily: DX.mono, color: DX.fgMuted }}>
          ⏱{formatUptime(uptimeSeconds)}
        </span>
        <span style={{ fontSize: 9, fontFamily: DX.mono, color: DX.fgMuted }}>
          {totalUpdates}× total
        </span>
      </div>

      {/* ── Chart body ── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {showSpinner && <Spinner />}
        {candles.length > 0 && <CandlestickChart candles={candles} showVolume={false} />}
        {isError && candles.length === 0 && <ErrorBody message={error ?? 'Stream error'} />}
      </div>

    </div>
  );
}

// ─── Pair dropdown ────────────────────────────────────────────────────────────
function PairDropdown({
  selected, onChange,
}: { selected: TokenPair; onChange: (p: TokenPair) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9, color: DX.fgMuted, fontFamily: DX.mono, letterSpacing: '0.06em' }}>
        PAIR
      </span>
      <select
        value={selected.id}
        onChange={e => {
          const p = TOKEN_PAIRS.find(x => x.id === e.target.value);
          if (p) onChange(p);
        }}
        style={{
          background:  DX.surface,
          border:      `1px solid ${DX.border}`,
          color:       DX.fg,
          fontFamily:  DX.mono,
          fontSize:    10,
          fontWeight:  700,
          padding:     '3px 8px',
          borderRadius: 4,
          cursor:      'pointer',
          outline:     'none',
          appearance:  'none',
          WebkitAppearance: 'none',
          letterSpacing: '0.04em',
          minWidth: 110,
        }}
      >
        {TOKEN_PAIRS.map(p => (
          <option key={p.id} value={p.id} style={{ background: DX.surface, color: DX.fg }}>
            {p.label}
          </option>
        ))}
      </select>
      {/* custom caret */}
      <span style={{
        position: 'relative', left: -22, pointerEvents: 'none',
        fontSize: 8, color: DX.fgMuted,
      }}>▾</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [pair, setPair] = useState<TokenPair>(DEFAULT_PAIR);

  const cgState = useCoinGeckoStream(pair);
  const grState = useGoldRushStream(pair);
  const mlState = useMoralisStream(pair);
  const bqState = useBitqueryStream(pair);

  const allStates      = [cgState, grState, mlState, bqState];
  const streamingCount = allStates.filter(s => s.status === 'streaming').length;
  const anyConnecting  = allStates.some(s => s.status === 'connecting');

  return (
    <>
      <style>{`
        @keyframes dx-spin  { to { transform: rotate(360deg) } }
        @keyframes dx-pulse { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        select option { background: #222; color: #f2f2f2; }
      `}</style>

      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        background: DX.bg, color: DX.fg, fontFamily: DX.mono,
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          height: 44, flexShrink: 0,
          borderBottom: `1px solid ${DX.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          {/* left — live indicator + pair label + subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: streamingCount > 0 ? DX.accent : DX.warning,
              display: 'inline-block', flexShrink: 0,
              animation: anyConnecting ? 'dx-pulse 1.5s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {pair.baseSymbol} / {pair.quoteSymbol}
            </span>
            <span style={{ fontSize: 9, color: DX.fgMuted, letterSpacing: '0.04em' }}>
              OHLCV · 2 WSS + 2 REST · 1-day range
            </span>
          </div>

          {/* right — live count + pair selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontSize: 10, fontFamily: DX.mono,
              color: streamingCount === 4 ? DX.accent : DX.fgMuted,
            }}>
              {streamingCount} / 4 live
            </span>
            <PairDropdown selected={pair} onChange={p => setPair(p)} />
          </div>
        </div>

        {/* ── 2×2 chart grid ──
              [CoinGecko  REST]   [GoldRush  WSS]
              [Moralis    REST]   [Bitquery  WSS]
        ── */}
        <div style={{
          flex: 1, minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows:    '1fr 1fr',
          gap: 1, background: DX.borderLight, padding: 1,
        }}>
          <StreamPanel config={PANEL_CONFIGS[0]} state={cgState} />
          <StreamPanel config={PANEL_CONFIGS[1]} state={grState} />
          <StreamPanel config={PANEL_CONFIGS[2]} state={mlState} />
          <StreamPanel config={PANEL_CONFIGS[3]} state={bqState} />
        </div>

      </div>
    </>
  );
}
