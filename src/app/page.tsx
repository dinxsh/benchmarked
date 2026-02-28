'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CandlestickChart, OHLCVCandle } from '@/components/charts/CandlestickChart';

// ─── DexWorks design tokens ────────────────────────────────────────────────────
const DX = {
  bg:          '#1a1a1a',
  bgDeep:      '#111111',
  surface:     '#222222',
  fg:          '#f2f2f2',
  fgMuted:     '#888888',
  border:      '#444444',
  borderLight: '#333333',
  accent:      '#00d084',
  accentDim:   'rgba(0,208,132,0.15)',
  destructive: '#e74c3c',
  warning:     '#f59e0b',
  mono:        '"JetBrains Mono","Fira Code","Consolas",monospace',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type CellStatus = 'idle' | 'loading' | 'success' | 'error';

interface CellState {
  status: CellStatus;
  candles: OHLCVCandle[];
  latency: number | null;
  dataType: 'ohlcv' | 'synthetic' | null;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: 'coingecko', name: 'CoinGecko', type: 'REST', free: true  },
  { id: 'goldrush',  name: 'GoldRush',  type: 'REST', free: false },
  { id: 'moralis',   name: 'Moralis',   type: 'REST', free: false },
  { id: 'bitquery',  name: 'Bitquery',  type: 'GQL',  free: false },
] as const;

const TIMEFRAMES = [
  { label: '1D',  days: 1,  interval: '~30m/c' },
  { label: '7D',  days: 7,  interval: '~4h/c'  },
  { label: '30D', days: 30, interval: '~1d/c'  },
  { label: '90D', days: 90, interval: '~1d/c'  },
] as const;

const INIT_CELL: CellState = {
  status: 'idle', candles: [], latency: null, dataType: null, error: null,
};

// ─── Chart cell ───────────────────────────────────────────────────────────────
function ChartCell({ cell }: { cell: CellState }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRight:  `1px solid ${DX.borderLight}`,
        borderBottom: `1px solid ${DX.borderLight}`,
        background:   DX.bgDeep,
        overflow:     'hidden',
        minHeight:    0,
      }}
    >
      {/* ── loading overlay ── */}
      {cell.status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(17,17,17,0.82)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        }}>
          <div style={{
            width: 28, height: 28,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'rgba(255,255,255,0.45)',
            borderRadius: '50%',
            animation: 'dx-spin 0.7s linear infinite',
          }} />
        </div>
      )}

      {/* ── chart ── */}
      {cell.status === 'success' && cell.candles.length > 0 && (
        <div style={{ position: 'relative', width: '100%', height: '100%', padding: '0 2px' }}>
          <CandlestickChart candles={cell.candles} showVolume={false} />
          {/* config badge */}
          <div style={{
            position: 'absolute', top: 8, right: 8, zIndex: 5,
            background: DX.surface, border: `1px solid ${DX.border}`,
            padding: '2px 7px', borderRadius: 5,
            fontSize: 10, color: DX.accent,
            fontFamily: DX.mono, fontWeight: 600, letterSpacing: '0.5px',
          }}>
            {cell.latency}ms{cell.dataType === 'synthetic' ? ' ~' : ''}
          </div>
        </div>
      )}

      {/* ── error ── */}
      {cell.status === 'error' && (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '0 14px', textAlign: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={DX.destructive} strokeWidth="1.5" opacity={0.35}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{
            fontSize: 9, color: DX.destructive, fontFamily: DX.mono,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            wordBreak: 'break-all', maxWidth: 180, lineHeight: 1.5,
          }}>
            {(cell.error ?? 'error').slice(0, 80)}
          </span>
        </div>
      )}

      {/* ── idle ── */}
      {cell.status === 'idle' && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#2a2a2a', fontFamily: DX.mono }}>—</span>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [grid, setGrid] = useState<Record<string, CellState>>({});

  function updateCell(key: string, update: Partial<CellState>) {
    setGrid(prev => ({ ...prev, [key]: { ...(prev[key] ?? INIT_CELL), ...update } }));
  }

  async function fetchCell(provider: string, days: number) {
    const key = `${provider}-${days}`;
    try {
      const res  = await fetch(`/api/chart-race?provider=${provider}&days=${days}`);
      const data = await res.json();
      if (data.status === 'success') {
        updateCell(key, {
          status: 'success', candles: data.candles,
          latency: data.latency, dataType: data.dataType, error: null,
        });
      } else {
        updateCell(key, {
          status: 'error', candles: [], latency: data.latency ?? null,
          error: data.error ?? 'Unknown error', dataType: null,
        });
      }
    } catch (err) {
      updateCell(key, {
        status: 'error', candles: [], latency: null,
        error: err instanceof Error ? err.message : 'Network error', dataType: null,
      });
    }
  }

  // Fire all 16 fetches on mount
  useEffect(() => {
    const init: Record<string, CellState> = {};
    for (const p of PROVIDERS) {
      for (const tf of TIMEFRAMES) {
        init[`${p.id}-${tf.days}`] = {
          status: 'loading', candles: [], latency: null, dataType: null, error: null,
        };
      }
    }
    setGrid(init);
    for (const p of PROVIDERS) {
      for (const tf of TIMEFRAMES) {
        void fetchCell(p.id, tf.days);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const cells = Object.values(grid);
    return {
      success: cells.filter(c => c.status === 'success').length,
      loading: cells.filter(c => c.status === 'loading').length,
      error:   cells.filter(c => c.status === 'error').length,
      total:   PROVIDERS.length * TIMEFRAMES.length,
    };
  }, [grid]);

  const isLive = summary.loading > 0;

  return (
    <>
      {/* ── keyframes + candlestick-svg sizing ── */}
      <style>{`
        @keyframes dx-spin  { to { transform: rotate(360deg) } }
        @keyframes dx-pulse { 0%,100% { opacity:1 } 50% { opacity:0.25 } }
        .candlestick-svg { width: 100%; height: auto; display: block; }
      `}</style>

      <div style={{
        height: '100dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: DX.bg, color: DX.fg, fontFamily: DX.mono,
      }}>
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{
          height: 44, flexShrink: 0,
          borderBottom: `1px solid ${DX.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* live dot */}
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isLive ? DX.warning : DX.accent,
              display: 'inline-block', flexShrink: 0,
              animation: isLive ? 'dx-pulse 1.5s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: DX.fg }}>
              ETH/USD OHLCV GRID
            </span>
            <span style={{ fontSize: 9, color: DX.fgMuted, letterSpacing: '0.04em' }}>
              4 providers · 4 timeframes · 16 charts
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10 }}>
            {summary.loading > 0 && (
              <span style={{ color: DX.warning }}>⟳ {summary.loading} fetching</span>
            )}
            <span style={{ color: summary.success === summary.total ? DX.accent : DX.fgMuted }}>
              ✓ {summary.success} / {summary.total}
            </span>
            {summary.error > 0 && (
              <span style={{ color: DX.destructive }}>✗ {summary.error}</span>
            )}
          </div>
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1, minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '56px repeat(4, 1fr)',
            gridTemplateRows:    '48px repeat(4, 1fr)',
            overflow: 'hidden',
          }}
        >
          {/* corner */}
          <div style={{ borderRight: `1px solid ${DX.border}`, borderBottom: `1px solid ${DX.border}`, background: DX.bg }} />

          {/* provider column headers */}
          {PROVIDERS.map(p => (
            <div key={p.id} style={{
              borderRight: `1px solid ${DX.border}`,
              borderBottom: `1px solid ${DX.border}`,
              background: DX.bg,
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-start', justifyContent: 'center',
              padding: '0 12px', gap: 3,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: DX.fg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {p.name}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: DX.fgMuted, background: DX.surface, padding: '1px 5px', borderRadius: 3 }}>
                  {p.type}
                </span>
                {p.free
                  ? <span style={{ fontSize: 9, color: DX.accent }}>free</span>
                  : <span style={{ fontSize: 9, color: '#555' }}>★ key</span>
                }
              </div>
            </div>
          ))}

          {/* timeframe rows */}
          {TIMEFRAMES.map(tf => (
            <React.Fragment key={tf.days}>
              {/* timeframe label cell */}
              <div style={{
                borderRight:  `1px solid ${DX.border}`,
                borderBottom: `1px solid ${DX.borderLight}`,
                background: DX.bg,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: DX.fg }}>{tf.label}</span>
                <span style={{ fontSize: 8, color: '#404040', fontFamily: DX.mono }}>{tf.interval}</span>
              </div>

              {/* chart cells — one per provider */}
              {PROVIDERS.map(p => (
                <ChartCell
                  key={`${p.id}-${tf.days}`}
                  cell={grid[`${p.id}-${tf.days}`] ?? INIT_CELL}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
