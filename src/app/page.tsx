'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CandlestickChart, OHLCVCandle } from '@/components/charts/CandlestickChart';

// ─── DexWorks tokens ──────────────────────────────────────────────────────────
const DX = {
  bg:          '#1a1a1a',
  bgDeep:      '#111111',
  surface:     '#222222',
  fg:          '#f2f2f2',
  fgMuted:     '#888888',
  border:      '#444444',
  borderLight: '#2a2a2a',
  accent:      '#00d084',
  accentDim:   'rgba(0,208,132,0.12)',
  destructive: '#e74c3c',
  warning:     '#f59e0b',
  mono:        '"JetBrains Mono","Fira Code","Consolas",monospace',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type CellStatus = 'idle' | 'loading' | 'success' | 'error';

interface ProviderState {
  status:   CellStatus;
  candles:  OHLCVCandle[];
  latency:  number | null;
  dataType: 'ohlcv' | 'synthetic' | null;
  interval: string | null;   // e.g. "~30m"
  error:    string | null;
  fetchedAt: number | null;  // epoch ms
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: 'coingecko', name: 'CoinGecko', type: 'REST', free: true  },
  { id: 'goldrush',  name: 'GoldRush',  type: 'REST', free: false },
  { id: 'moralis',   name: 'Moralis',   type: 'REST', free: false },
  { id: 'bitquery',  name: 'Bitquery',  type: 'GQL',  free: false },
] as const;

const DAYS         = 1;          // finest candle granularity
const REFRESH_MS   = 60_000;    // 1-minute sync interval
const TICK_MS      = 1_000;     // countdown tick

const INIT: ProviderState = {
  status: 'idle', candles: [], latency: null,
  dataType: null, interval: null, error: null, fetchedAt: null,
};

// ─── Single provider panel ────────────────────────────────────────────────────
function ProviderPanel({
  provider,
  state,
}: {
  provider: (typeof PROVIDERS)[number];
  state: ProviderState;
}) {
  const { status, candles, latency, dataType, interval, error, fetchedAt } = state;
  const isLoading = status === 'loading';

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      background: DX.bgDeep,
      border: `1px solid ${DX.border}`,
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* ── panel header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px',
        borderBottom: `1px solid ${DX.borderLight}`,
        background: DX.bg, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: DX.fg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {provider.name}
          </span>
          <span style={{ fontSize: 9, color: DX.fgMuted, background: DX.surface, padding: '1px 5px', borderRadius: 3 }}>
            {provider.type}
          </span>
          {provider.free
            ? <span style={{ fontSize: 9, color: DX.accent }}>free</span>
            : <span style={{ fontSize: 9, color: '#4a4a4a' }}>★ key</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* interval badge */}
          {interval && status === 'success' && (
            <span style={{
              fontSize: 9, color: DX.fgMuted,
              background: DX.surface, padding: '1px 5px', borderRadius: 3,
            }}>
              {interval}{dataType === 'synthetic' ? ' ~synth' : ''}
            </span>
          )}
          {/* latency */}
          {latency !== null && status === 'success' && (
            <span style={{
              fontSize: 10, color: latency < 400 ? DX.accent : latency < 900 ? DX.warning : DX.destructive,
              fontFamily: DX.mono, fontWeight: 600,
            }}>
              {latency}ms
            </span>
          )}
          {/* live dot */}
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: isLoading ? DX.warning : status === 'success' ? DX.accent : status === 'error' ? DX.destructive : '#333',
            display: 'inline-block',
            animation: isLoading ? 'dx-pulse 1.2s ease-in-out infinite' : 'none',
          }} />
        </div>
      </div>

      {/* ── chart body ── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>

        {/* loading overlay */}
        {isLoading && (
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
        )}

        {/* success — chart */}
        {status === 'success' && candles.length > 0 && (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            // subtle blur while loading the next refresh cycle
            filter: isLoading ? 'blur(3px)' : 'none',
            opacity: isLoading ? 0.5 : 1,
            transition: 'filter 0.25s, opacity 0.25s',
          }}>
            <CandlestickChart candles={candles} showVolume />
            {fetchedAt && (
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                fontSize: 8, color: '#3a3a3a', fontFamily: DX.mono,
              }}>
                {new Date(fetchedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* error */}
        {status === 'error' && (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '0 16px', textAlign: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke={DX.destructive} strokeWidth="1.2" opacity={0.4}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9"  x2="12"   y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{
              fontSize: 10, color: DX.destructive, fontFamily: DX.mono,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              lineHeight: 1.5, maxWidth: 200, wordBreak: 'break-word',
            }}>
              {error ?? 'Unknown error'}
            </span>
          </div>
        )}

        {/* idle */}
        {status === 'idle' && (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#2a2a2a', fontFamily: DX.mono }}>—</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [states, setStates] = useState<Record<string, ProviderState>>(
    Object.fromEntries(PROVIDERS.map(p => [p.id, INIT]))
  );
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const countdownRef = useRef(REFRESH_MS / 1000);

  function updateProvider(id: string, patch: Partial<ProviderState>) {
    setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const fetchProvider = useCallback(async (id: string) => {
    updateProvider(id, { status: 'loading' });
    try {
      const res  = await fetch(`/api/chart-race?provider=${id}&days=${DAYS}`);
      const data = await res.json();
      if (data.status === 'success') {
        updateProvider(id, {
          status: 'success', candles: data.candles, latency: data.latency,
          dataType: data.dataType, interval: data.candleInterval,
          error: null, fetchedAt: Date.now(),
        });
      } else {
        updateProvider(id, {
          status: 'error', candles: [], latency: null,
          error: data.error ?? 'Request failed', fetchedAt: null,
        });
      }
    } catch (err) {
      updateProvider(id, {
        status: 'error', candles: [], latency: null,
        error: err instanceof Error ? err.message : 'Network error', fetchedAt: null,
      });
    }
  }, []);

  const fetchAll = useCallback(() => {
    countdownRef.current = REFRESH_MS / 1000;
    setCountdown(REFRESH_MS / 1000);
    for (const p of PROVIDERS) void fetchProvider(p.id);
  }, [fetchProvider]);

  // Initial fetch + periodic refresh
  useEffect(() => {
    fetchAll();
    const refresh = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(refresh);
  }, [fetchAll]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1);
      setCountdown(countdownRef.current);
    }, TICK_MS);
    return () => clearInterval(tick);
  }, []);

  const values = Object.values(states);
  const successCount = values.filter(s => s.status === 'success').length;
  const loadingCount = values.filter(s => s.status === 'loading').length;
  const isLive       = loadingCount > 0;

  return (
    <>
      <style>{`
        @keyframes dx-spin  { to { transform: rotate(360deg) } }
        @keyframes dx-pulse { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
        .candlestick-svg { width:100%; height:auto; display:block; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
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
          {/* left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isLive ? DX.warning : DX.accent,
              display: 'inline-block', flexShrink: 0,
              animation: isLive ? 'dx-pulse 1.5s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ETH / USD
            </span>
            <span style={{ fontSize: 9, color: DX.fgMuted, letterSpacing: '0.04em' }}>
              OHLCV · 4 providers · 1-day range · syncs every 60s
            </span>
          </div>

          {/* right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 10 }}>
            {loadingCount > 0 && (
              <span style={{ color: DX.warning }}>⟳ {loadingCount} fetching</span>
            )}
            <span style={{ color: successCount === PROVIDERS.length ? DX.accent : DX.fgMuted }}>
              {successCount} / {PROVIDERS.length} ready
            </span>
            {/* countdown pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: DX.surface, border: `1px solid ${DX.borderLight}`,
              padding: '2px 8px', borderRadius: 4,
            }}>
              <span style={{ color: DX.fgMuted }}>refresh in</span>
              <span style={{
                color: countdown <= 10 ? DX.warning : DX.fg,
                fontWeight: 700, minWidth: 18, textAlign: 'right',
              }}>
                {countdown}s
              </span>
            </div>
            <button
              onClick={fetchAll}
              style={{
                background: DX.accentDim, border: `1px solid ${DX.accent}`,
                color: DX.accent, padding: '3px 10px', borderRadius: 4,
                fontSize: 10, cursor: 'pointer', fontFamily: DX.mono,
                fontWeight: 700, letterSpacing: '0.06em',
              }}
            >
              ⟳ NOW
            </button>
          </div>
        </div>

        {/* ── 2×2 chart grid ── */}
        <div style={{
          flex: 1, minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows:    '1fr 1fr',
          gap: 1,
          background: DX.borderLight, // gap color
          padding: 1,
        }}>
          {PROVIDERS.map(p => (
            <ProviderPanel key={p.id} provider={p} state={states[p.id] ?? INIT} />
          ))}
        </div>
      </div>
    </>
  );
}
