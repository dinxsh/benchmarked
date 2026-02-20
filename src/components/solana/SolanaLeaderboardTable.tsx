'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface SolanaProvider {
  id: string;
  name: string;
  is_us: boolean;
  rank: number;
  score: number;
  is_mock: boolean;
  provider_type: 'json-rpc' | 'rest-api' | 'data-api';
  website_url: string;
  pricing: { cost_per_million: number; rate_limit: string };
  capabilities: {
    transactions: boolean;
    logs: boolean;
    token_balances: boolean;
    nft_metadata: boolean;
    historical_depth: string;
    custom_indexing: boolean;
    traces: boolean;
  };
  supported_chains: string[];
  metrics: {
    latency_p50: number;
    latency_p95: number;
    latency_p99: number;
    uptime_percent: number;
    error_rate: number;
    throughput_rps: number;
    slot_height: number;
  };
}

type SortKey = 'rank' | 'latency_p50' | 'latency_p95' | 'latency_p99' | 'uptime_percent' | 'error_rate' | 'throughput_rps' | 'score';
type TypeFilter = 'all' | 'json-rpc' | 'rest-api' | 'data-api';

interface Props {
  providers: SolanaProvider[];
  onSelect?: (provider: SolanaProvider) => void;
}

function latencyColor(ms: number): string {
  if (ms < 100) return 'text-accent';
  if (ms < 300) return 'text-chart-3';
  return 'text-destructive';
}

function uptimeColor(pct: number): string {
  if (pct >= 99.5) return 'text-accent';
  if (pct >= 98) return 'text-chart-3';
  return 'text-destructive';
}

function errColor(pct: number): string {
  if (pct < 1) return 'text-accent';
  if (pct < 5) return 'text-chart-3';
  return 'text-destructive';
}

function formatSlot(slot: number): string {
  if (!slot) return '—';
  return `${(slot / 1_000_000).toFixed(1)}M`;
}

function scoreBarColor(score: number): string {
  if (score >= 85) return 'bg-accent';
  if (score >= 70) return 'bg-chart-3';
  return 'bg-destructive';
}

function scoreTextColor(score: number): string {
  if (score >= 85) return 'text-accent';
  if (score >= 70) return 'text-chart-3';
  return 'text-destructive';
}

const TYPE_BADGE: Record<string, string> = {
  'json-rpc': 'bg-accent/10 text-accent border-accent/20',
  'rest-api': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'data-api': 'bg-destructive/10 text-destructive border-destructive/20',
};
const TYPE_LABEL: Record<string, string> = {
  'json-rpc': 'RPC',
  'rest-api': 'REST',
  'data-api': 'Data',
};

export function SolanaLeaderboardTable({ providers, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(['latency_p50', 'latency_p95', 'latency_p99', 'error_rate', 'rank'].includes(key) ? 'asc' : 'desc');
    }
  }

  const filtered = typeFilter === 'all' ? providers : providers.filter(p => p.provider_type === typeFilter);

  const sorted = [...filtered].sort((a, b) => {
    let av: number, bv: number;
    switch (sortKey) {
      case 'rank': av = a.rank; bv = b.rank; break;
      case 'latency_p50': av = a.metrics.latency_p50; bv = b.metrics.latency_p50; break;
      case 'latency_p95': av = a.metrics.latency_p95; bv = b.metrics.latency_p95; break;
      case 'latency_p99': av = a.metrics.latency_p99; bv = b.metrics.latency_p99; break;
      case 'uptime_percent': av = a.metrics.uptime_percent; bv = b.metrics.uptime_percent; break;
      case 'error_rate': av = a.metrics.error_rate; bv = b.metrics.error_rate; break;
      case 'throughput_rps': av = a.metrics.throughput_rps; bv = b.metrics.throughput_rps; break;
      case 'score': av = a.score; bv = b.score; break;
      default: av = a.rank; bv = b.rank;
    }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  // Leader = lowest P50 latency among all providers (not just filtered)
  const leader = providers.reduce(
    (best, p) => p.metrics.latency_p50 < best.metrics.latency_p50 ? p : best,
    providers[0]
  );

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="h-2.5 w-2.5 opacity-30 inline ml-0.5" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-2.5 w-2.5 text-accent inline ml-0.5" />
      : <ChevronDown className="h-2.5 w-2.5 text-accent inline ml-0.5" />;
  }

  function Th({ col, label, align = 'right' }: { col: SortKey; label: string; align?: 'left' | 'right' }) {
    return (
      <th
        className={`py-2 px-2 text-${align} text-[9px] uppercase tracking-wider text-muted-foreground font-medium cursor-pointer select-none hover:text-foreground transition-colors`}
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon col={col} />
      </th>
    );
  }

  const filterButtons: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all',      label: 'All',  count: providers.length },
    { key: 'json-rpc', label: 'RPC',  count: providers.filter(p => p.provider_type === 'json-rpc').length },
    { key: 'rest-api', label: 'REST', count: providers.filter(p => p.provider_type === 'rest-api').length },
    { key: 'data-api', label: 'Data', count: providers.filter(p => p.provider_type === 'data-api').length },
  ];

  return (
    <div>
      {/* Type Filter Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/10">
        <div className="flex items-center gap-1">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setTypeFilter(btn.key)}
              className={`text-[9px] font-mono uppercase px-2 py-1 rounded transition-colors ${
                typeFilter === btn.key
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/60">
          {filtered.length} provider{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <Th col="rank" label="Rank" align="left" />
              <th className="py-2 px-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Type</th>
              <th className="py-2 px-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Provider</th>
              <Th col="latency_p50" label="P50" />
              <th className="py-2 px-2 text-right text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Δ vs #1</th>
              <Th col="latency_p95" label="P95" />
              <Th col="latency_p99" label="P99" />
              <Th col="uptime_percent" label="Uptime" />
              <Th col="error_rate" label="Err%" />
              <Th col="throughput_rps" label="RPS" />
              <th className="py-2 px-2 text-right text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Slot</th>
              <th className="py-2 px-2 text-right text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Chains</th>
              <Th col="score" label="Score" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const delta = p.metrics.latency_p50 - (leader?.metrics.latency_p50 ?? 0);
              const isLeader = p.id === leader?.id;
              return (
                <tr
                  key={p.id}
                  className={`border-b border-border transition-colors ${
                    onSelect ? 'cursor-pointer' : ''
                  } ${
                    p.is_us
                      ? 'bg-accent/10 hover:bg-accent/15'
                      : p.rank === 1
                      ? 'bg-accent/5 hover:bg-accent/10'
                      : 'hover:bg-muted/30'
                  }`}
                  style={p.is_us ? { borderLeft: '2px solid hsl(var(--accent) / 0.8)' } : undefined}
                  onClick={() => onSelect?.(p)}
                >
                  {/* Rank */}
                  <td className="py-2 px-2 tabular-nums">
                    <span className={
                      p.rank === 1 ? 'text-chart-3 font-bold' :
                      p.rank <= 3  ? 'text-chart-5' :
                      'text-muted-foreground/60'
                    }>
                      #{p.rank}
                    </span>
                  </td>
                  {/* Type */}
                  <td className="py-2 px-2">
                    <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded border ${TYPE_BADGE[p.provider_type]}`}>
                      {TYPE_LABEL[p.provider_type]}
                    </span>
                  </td>
                  {/* Provider name */}
                  <td className="py-2 px-2">
                    <span className="flex items-center gap-1.5">
                      {p.is_us && (
                        <span className="text-[8px] font-bold text-accent bg-accent/15 px-1 py-0.5 rounded">★ US</span>
                      )}
                      <span className={`font-medium ${p.is_us ? 'text-accent' : 'text-foreground'}`}>
                        {p.name}
                      </span>
                      {p.is_mock && (
                        <span className="text-[8px] text-muted-foreground/50">(sim)</span>
                      )}
                    </span>
                  </td>
                  {/* P50 */}
                  <td className={`py-2 px-2 text-right tabular-nums ${latencyColor(p.metrics.latency_p50)}`}>
                    {p.metrics.latency_p50}ms
                  </td>
                  {/* Δ vs #1 */}
                  <td className="py-2 px-2 text-right tabular-nums">
                    {isLeader
                      ? <span className="text-accent">—</span>
                      : <span className="text-muted-foreground/70">+{delta}ms</span>
                    }
                  </td>
                  {/* P95 */}
                  <td className={`py-2 px-2 text-right tabular-nums ${latencyColor(p.metrics.latency_p95)}`}>
                    {p.metrics.latency_p95}ms
                  </td>
                  {/* P99 */}
                  <td className={`py-2 px-2 text-right tabular-nums ${latencyColor(p.metrics.latency_p99)}`}>
                    {p.metrics.latency_p99}ms
                  </td>
                  {/* Uptime */}
                  <td className={`py-2 px-2 text-right tabular-nums ${uptimeColor(p.metrics.uptime_percent)}`}>
                    {p.metrics.uptime_percent.toFixed(1)}%
                  </td>
                  {/* Err% */}
                  <td className={`py-2 px-2 text-right tabular-nums ${errColor(p.metrics.error_rate)}`}>
                    {p.metrics.error_rate.toFixed(1)}%
                  </td>
                  {/* RPS */}
                  <td className="py-2 px-2 text-right tabular-nums text-primary">
                    {p.metrics.throughput_rps}
                  </td>
                  {/* Slot */}
                  <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                    {formatSlot(p.metrics.slot_height)}
                  </td>
                  {/* Chains count */}
                  <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                    {p.supported_chains.length}
                  </td>
                  {/* Score mini-bar */}
                  <td className="py-2 px-2 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-12 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div className={scoreBarColor(p.score)} style={{ width: `${p.score}%`, height: '100%' }} />
                      </div>
                      <span className={`${scoreTextColor(p.score)} text-[10px] tabular-nums`}>
                        {p.score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
