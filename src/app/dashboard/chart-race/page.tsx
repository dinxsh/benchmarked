'use client';

import { useMemo, useState } from 'react';
import { CandlestickChart, OHLCVCandle } from '@/components/charts/CandlestickChart';

// --- Types ---
type CellStatus = 'idle' | 'loading' | 'success' | 'error';

interface CellState {
  status: CellStatus;
  candles: OHLCVCandle[];
  latency: number | null;
  dataType: 'ohlcv' | 'synthetic' | null;
  error: string | null;
}

// --- Constants ---
const PROVIDERS = [
  { id: 'coingecko', name: 'CoinGecko', type: 'REST', free: true },
  { id: 'goldrush', name: 'GoldRush', type: 'REST', free: false },
  { id: 'moralis', name: 'Moralis', type: 'REST', free: false },
  { id: 'bitquery', name: 'Bitquery', type: 'GQL', free: false },
] as const;

const TIMEFRAMES = [
  { label: '1D', days: 1, candleInterval: '~30m/c' },
  { label: '7D', days: 7, candleInterval: '~4h/c' },
  { label: '30D', days: 30, candleInterval: '~1d/c' },
  { label: '90D', days: 90, candleInterval: '~1d/c' },
] as const;

const INIT_CELL: CellState = {
  status: 'idle',
  candles: [],
  latency: null,
  dataType: null,
  error: null,
};

// --- Helpers ---
function latencyColor(ms: number): string {
  if (ms < 300) return '#00d084';
  if (ms < 800) return '#f59e0b';
  return '#e74c3c';
}

function rankLabel(rank: number): string {
  return `#${rank}`;
}

function rankColor(rank: number): string {
  if (rank === 1) return '#00d084';
  if (rank === 2) return '#f59e0b';
  if (rank === 3) return '#888';
  return '#555';
}

// --- Sub-components ---
function ProviderHeader({ provider }: { provider: (typeof PROVIDERS)[number] }) {
  return (
    <div
      className="border-b border-r px-2 py-2 flex flex-col gap-0.5"
      style={{ borderColor: '#222' }}
    >
      <span className="text-[11px] font-bold tracking-wider uppercase">
        {provider.name}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          className="text-[9px] px-1 py-0.5 rounded"
          style={{ background: '#1a1a1a', color: '#666' }}
        >
          {provider.type}
        </span>
        {provider.free ? (
          <span className="text-[9px]" style={{ color: '#00d084' }}>
            free
          </span>
        ) : (
          <span className="text-[9px]" style={{ color: '#555' }}>
            ★key
          </span>
        )}
      </div>
    </div>
  );
}

function TimeframeLabel({
  tf,
}: {
  tf: (typeof TIMEFRAMES)[number];
}) {
  return (
    <div
      className="border-b border-r flex flex-col items-center justify-center py-2 px-1"
      style={{ borderColor: '#222', minHeight: '220px' }}
    >
      <span className="text-[13px] font-bold">{tf.label}</span>
      <span className="text-[9px] mt-0.5" style={{ color: '#555' }}>
        {tf.candleInterval}
      </span>
    </div>
  );
}

function ChartCell({
  cell,
  rank,
}: {
  cell: CellState | undefined;
  rank: number | undefined;
}) {
  const state = cell ?? INIT_CELL;

  return (
    <div
      className="border-b border-r relative"
      style={{
        borderColor: '#222',
        minHeight: '220px',
        background:
          state.status === 'error' ? 'rgba(231,76,60,0.04)' : '#0d0d0d',
      }}
    >
      {/* Status bar */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 border-b"
        style={{ borderColor: '#1a1a1a', background: '#111' }}
      >
        {state.status === 'success' && rank !== undefined && (
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: rankColor(rank) }}
          >
            {rankLabel(rank)}
          </span>
        )}
        {state.status === 'success' && state.latency !== null && (
          <span
            className="text-[10px] tabular-nums"
            style={{ color: latencyColor(state.latency) }}
          >
            ◆ {state.latency}ms
          </span>
        )}
        {state.status === 'loading' && (
          <span className="text-[10px] animate-pulse" style={{ color: '#555' }}>
            ⟳ FETCHING
          </span>
        )}
        {state.status === 'error' && (
          <span className="text-[10px]" style={{ color: '#e74c3c' }}>
            ✗ ERR
          </span>
        )}
        {state.status === 'idle' && (
          <span className="text-[10px]" style={{ color: '#333' }}>
            —
          </span>
        )}
        {state.status === 'success' && state.dataType === 'synthetic' && (
          <span
            className="text-[9px] ml-auto px-1"
            style={{ color: '#555', background: '#1a1a1a' }}
          >
            ~OHLCV
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex items-center justify-center" style={{ height: '188px' }}>
        {state.status === 'idle' && (
          <span className="text-[10px]" style={{ color: '#2a2a2a' }}>
            IDLE
          </span>
        )}
        {state.status === 'loading' && (
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#333', borderTopColor: '#555' }}
            />
            <span className="text-[9px]" style={{ color: '#444' }}>
              FETCHING…
            </span>
          </div>
        )}
        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-1 px-3 text-center">
            <span className="text-[18px]">✗</span>
            <span className="text-[10px] font-bold" style={{ color: '#e74c3c' }}>
              ERROR
            </span>
            <span
              className="text-[9px] leading-tight"
              style={{ color: '#666', maxWidth: '140px' }}
            >
              {state.error ?? 'Unknown error'}
            </span>
          </div>
        )}
        {state.status === 'success' && state.candles.length > 0 && (
          <div style={{ width: '100%', height: '100%' }}>
            <CandlestickChart candles={state.candles} showVolume={false} />
          </div>
        )}
        {state.status === 'success' && state.candles.length === 0 && (
          <span className="text-[10px]" style={{ color: '#555' }}>
            NO DATA
          </span>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function ChartRacePage() {
  const [grid, setGrid] = useState<Record<string, CellState>>({});
  const [isRacing, setIsRacing] = useState(false);

  function updateCell(key: string, update: Partial<CellState>) {
    setGrid((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? INIT_CELL), ...update },
    }));
  }

  async function fetchCell(provider: string, days: number) {
    const key = `${provider}-${days}`;
    try {
      const res = await fetch(
        `/api/chart-race?provider=${provider}&days=${days}`
      );
      const data = await res.json();
      if (data.status === 'success') {
        updateCell(key, {
          status: 'success',
          candles: data.candles,
          latency: data.latency,
          dataType: data.dataType,
          error: null,
        });
      } else {
        updateCell(key, {
          status: 'error',
          candles: [],
          latency: data.latency ?? null,
          error: data.error ?? 'Unknown error',
        });
      }
    } catch (err) {
      updateCell(key, {
        status: 'error',
        candles: [],
        latency: null,
        error: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  function runRace() {
    if (isRacing) return;

    // Initialize all cells to loading immediately
    const init: Record<string, CellState> = {};
    for (const p of PROVIDERS) {
      for (const tf of TIMEFRAMES) {
        init[`${p.id}-${tf.days}`] = {
          status: 'loading',
          candles: [],
          latency: null,
          dataType: null,
          error: null,
        };
      }
    }
    setGrid(init);
    setIsRacing(true);

    // Fire all 16 requests simultaneously
    const promises = PROVIDERS.flatMap((p) =>
      TIMEFRAMES.map((tf) => fetchCell(p.id, tf.days))
    );

    Promise.allSettled(promises).then(() => setIsRacing(false));
  }

  function resetRace() {
    setGrid({});
    setIsRacing(false);
  }

  // Compute per-row rankings (rank 1 = fastest)
  const rankings = useMemo(() => {
    const result: Record<string, number> = {};
    for (const tf of TIMEFRAMES) {
      const rowCells = PROVIDERS.map((p) => ({
        provider: p.id,
        state: grid[`${p.id}-${tf.days}`],
      }))
        .filter(
          ({ state }) =>
            state?.status === 'success' && state.latency !== null
        )
        .sort((a, b) => (a.state.latency ?? 0) - (b.state.latency ?? 0));

      rowCells.forEach(({ provider }, idx) => {
        result[`${provider}-${tf.days}`] = idx + 1;
      });
    }
    return result;
  }, [grid]);

  // Summary statistics
  const summary = useMemo(() => {
    const allCells = Object.values(grid);
    const successCount = allCells.filter((c) => c.status === 'success').length;
    const errorCount = allCells.filter((c) => c.status === 'error').length;
    const totalCount = PROVIDERS.length * TIMEFRAMES.length;

    const providerAvgs = PROVIDERS.map((p) => {
      const latencies = TIMEFRAMES.map((tf) => {
        const cell = grid[`${p.id}-${tf.days}`];
        return cell?.status === 'success' && cell.latency !== null
          ? cell.latency
          : null;
      }).filter((l): l is number => l !== null);

      return {
        id: p.id,
        name: p.name,
        avg:
          latencies.length > 0
            ? Math.round(
                latencies.reduce((s, l) => s + l, 0) / latencies.length
              )
            : null,
        count: latencies.length,
      };
    })
      .filter((p) => p.avg !== null)
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));

    return {
      successCount,
      errorCount,
      totalCount,
      fastest: providerAvgs[0] ?? null,
      slowest:
        providerAvgs.length > 1
          ? providerAvgs[providerAvgs.length - 1]
          : null,
    };
  }, [grid]);

  return (
    <div
      className="flex flex-col font-mono text-xs"
      style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ccc' }}
    >
      {/* Page header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: '#1e1e1e', background: '#0d0d0d' }}
      >
        <div>
          <h1 className="text-sm font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
            ETH/USD CHART RACE
          </h1>
          <p className="text-[10px]" style={{ color: '#555' }}>
            Benchmarking OHLCV retrieval speed · 4 providers · 16 charts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runRace}
            disabled={isRacing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold tracking-wider border transition-colors"
            style={{
              borderColor: isRacing ? '#333' : '#00d084',
              color: isRacing ? '#444' : '#00d084',
              background: isRacing ? '#0d0d0d' : 'rgba(0,208,132,0.05)',
              cursor: isRacing ? 'not-allowed' : 'pointer',
            }}
          >
            {isRacing ? (
              <>
                <span className="animate-spin inline-block">⟳</span>
                RACING…
              </>
            ) : (
              <>▶ RUN RACE</>
            )}
          </button>
          <button
            onClick={resetRace}
            className="px-2 py-1.5 text-[11px] border transition-colors"
            style={{
              borderColor: '#222',
              color: '#555',
              background: '#0d0d0d',
              cursor: 'pointer',
            }}
            title="Reset"
          >
            ⟳
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: '72px repeat(4, minmax(200px, 1fr))',
            minWidth: '872px',
          }}
        >
          {/* Corner cell */}
          <div
            className="border-b border-r px-2 py-2"
            style={{ borderColor: '#222', background: '#0d0d0d' }}
          >
            <span className="text-[9px]" style={{ color: '#333' }}>
              TF / PROV
            </span>
          </div>

          {/* Provider headers */}
          {PROVIDERS.map((p) => (
            <ProviderHeader key={p.id} provider={p} />
          ))}

          {/* Data rows */}
          {TIMEFRAMES.map((tf) => (
            <>
              <TimeframeLabel key={`tf-${tf.days}`} tf={tf} />
              {PROVIDERS.map((p) => {
                const key = `${p.id}-${tf.days}`;
                return (
                  <ChartCell
                    key={key}
                    cell={grid[key]}
                    rank={rankings[key]}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="flex items-center gap-6 px-4 py-2 border-t text-[10px]"
        style={{ borderColor: '#1e1e1e', background: '#0d0d0d' }}
      >
        {summary.fastest && (
          <span>
            <span style={{ color: '#555' }}>FASTEST: </span>
            <span style={{ color: '#00d084' }}>
              {summary.fastest.name} {summary.fastest.avg}ms avg
            </span>
          </span>
        )}
        <span>
          <span style={{ color: '#555' }}>SUCCESS </span>
          <span style={{ color: '#ccc' }}>
            {summary.successCount}/{summary.totalCount}
          </span>
        </span>
        {summary.errorCount > 0 && (
          <span>
            <span style={{ color: '#555' }}>ERRORS </span>
            <span style={{ color: '#e74c3c' }}>{summary.errorCount}</span>
          </span>
        )}
        {summary.slowest && (
          <span>
            <span style={{ color: '#555' }}>SLOWEST: </span>
            <span style={{ color: '#e74c3c' }}>
              {summary.slowest.name} {summary.slowest.avg}ms avg
            </span>
          </span>
        )}
        {summary.successCount === 0 && summary.errorCount === 0 && (
          <span style={{ color: '#333' }}>
            Click ▶ RUN RACE to start benchmarking
          </span>
        )}
      </div>
    </div>
  );
}
