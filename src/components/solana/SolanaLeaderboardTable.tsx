'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Info } from 'lucide-react';

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

type SortKey =
  | 'rank' | 'latency_p50' | 'latency_p95' | 'latency_p99'
  | 'uptime_percent' | 'error_rate' | 'throughput_rps' | 'score'
  | 'jitter' | 'cost' | 'value_score';

type TypeFilter = 'all' | 'json-rpc' | 'rest-api' | 'data-api';

interface Props {
  providers: SolanaProvider[];
  onSelect?: (provider: SolanaProvider) => void;
}

// ─── Color helpers ─────────────────────────────────────────────────────────────
function latencyColor(ms: number): string {
  if (ms < 100) return 'text-accent';
  if (ms < 300) return 'text-chart-3';
  return 'text-destructive';
}

function uptimeColor(pct: number): string {
  if (pct >= 99.5) return 'text-chart-2';
  if (pct >= 98)   return 'text-chart-3';
  return 'text-destructive';
}

function errColor(pct: number): string {
  if (pct < 1) return 'text-chart-2';
  if (pct < 5) return 'text-chart-3';
  return 'text-destructive';
}

function jitterColor(ms: number): string {
  if (ms < 50)  return 'text-chart-2';
  if (ms < 150) return 'text-chart-3';
  return 'text-destructive';
}

function formatSlot(slot: number): string {
  if (!slot) return '—';
  return `${(slot / 1_000_000).toFixed(1)}M`;
}

function valueScore(p: SolanaProvider): number {
  if (p.pricing.cost_per_million === 0) return 999_999;
  return p.score / p.pricing.cost_per_million;
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="inline-flex items-center text-xs font-bold tabular-nums"
      style={{ color: 'oklch(0.80 0.15 80)' }}>
      #{rank}
    </span>
  );
  if (rank === 2) return <span className="text-xs font-semibold tabular-nums text-muted-foreground/80">#{rank}</span>;
  if (rank === 3) return (
    <span className="text-xs font-semibold tabular-nums"
      style={{ color: 'oklch(0.65 0.10 55)' }}>
      #{rank}
    </span>
  );
  return <span className="text-xs font-mono tabular-nums text-muted-foreground/50">#{rank}</span>;
}

const TYPE_BADGE: Record<string, string> = {
  'json-rpc': 'bg-accent/10 text-accent border-accent/20',
  'rest-api': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'data-api': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
};
const TYPE_LABEL: Record<string, string> = {
  'json-rpc': 'RPC',
  'rest-api': 'REST',
  'data-api': 'Data',
};

function ScoreBar({ score }: { score: number }) {
  const isGood = score >= 85;
  const isMid  = score >= 70;
  const color  = isGood ? 'var(--color-accent)' : isMid ? 'var(--color-chart-3)' : 'var(--color-destructive)';
  const textCls = isGood ? 'text-accent' : isMid ? 'text-chart-3' : 'text-destructive';
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-14 h-[5px] bg-border/30 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className={`${textCls} font-mono tabular-nums text-xs font-bold w-9 text-right`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

interface DecisionBadge { text: string; className: string; }

const BADGE_STYLES: Record<string, string> = {
  'Best Overall': 'bg-accent/12 text-accent border-accent/25',
  'Fastest':      'bg-accent/8 text-accent/80 border-accent/18',
  'Throughput':   'bg-chart-2/10 text-chart-2/85 border-chart-2/22',
  'Free':         'bg-chart-3/10 text-chart-3/85 border-chart-3/22',
  'Most Stable':  'bg-chart-5/10 text-chart-5/85 border-chart-5/22',
};

// ─── Main component ────────────────────────────────────────────────────────────
export function SolanaLeaderboardTable({ providers, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Lower is better: latency, error_rate, jitter, cost, rank
      const ascFirst: SortKey[] = ['latency_p50', 'latency_p95', 'latency_p99', 'error_rate', 'jitter', 'cost', 'rank'];
      setSortDir(ascFirst.includes(key) ? 'asc' : 'desc');
    }
  }

  const filtered = typeFilter === 'all' ? providers : providers.filter(p => p.provider_type === typeFilter);

  const sorted = [...filtered].sort((a, b) => {
    let av: number, bv: number;
    switch (sortKey) {
      case 'rank':           av = a.rank;                                   bv = b.rank;                                   break;
      case 'latency_p50':    av = a.metrics.latency_p50;                    bv = b.metrics.latency_p50;                    break;
      case 'latency_p95':    av = a.metrics.latency_p95;                    bv = b.metrics.latency_p95;                    break;
      case 'latency_p99':    av = a.metrics.latency_p99;                    bv = b.metrics.latency_p99;                    break;
      case 'uptime_percent': av = a.metrics.uptime_percent;                 bv = b.metrics.uptime_percent;                 break;
      case 'error_rate':     av = a.metrics.error_rate;                     bv = b.metrics.error_rate;                     break;
      case 'throughput_rps': av = a.metrics.throughput_rps;                 bv = b.metrics.throughput_rps;                 break;
      case 'score':          av = a.score;                                  bv = b.score;                                  break;
      case 'jitter':         av = a.metrics.latency_p99 - a.metrics.latency_p50; bv = b.metrics.latency_p99 - b.metrics.latency_p50; break;
      case 'cost':           av = a.pricing.cost_per_million;               bv = b.pricing.cost_per_million;               break;
      case 'value_score':    av = valueScore(a);                            bv = valueScore(b);                            break;
      default:               av = a.rank;                                   bv = b.rank;
    }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const leader  = providers.reduce(
    (best, p) => p.metrics.latency_p50 < best.metrics.latency_p50 ? p : best,
    providers[0]
  );
  const maxP50  = Math.max(...providers.map(p => p.metrics.latency_p50), 1);

  // Decision badges
  const rankOne    = providers.find(p => p.rank === 1);
  const byP50      = [...providers].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50);
  const byRps      = [...providers].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps);
  const byJitter   = [...providers].sort((a, b) =>
    (a.metrics.latency_p99 - a.metrics.latency_p50) - (b.metrics.latency_p99 - b.metrics.latency_p50));
  const frees      = providers.filter(p => p.pricing.cost_per_million === 0);
  const bestFreeId = frees.length > 0 ? frees.reduce((a, b) => a.score > b.score ? a : b).id : null;

  const decisionBadges: Record<string, DecisionBadge[]> = {};
  if (rankOne) decisionBadges[rankOne.id] = [{ text: 'Best Overall', className: BADGE_STYLES['Best Overall'] }];
  if (byP50[0] && byP50[0].id !== rankOne?.id) {
    const id = byP50[0].id;
    decisionBadges[id] = [...(decisionBadges[id] ?? []), { text: 'Fastest', className: BADGE_STYLES['Fastest'] }];
  }
  if (byRps[0] && byRps[0].id !== rankOne?.id) {
    const id = byRps[0].id;
    decisionBadges[id] = [...(decisionBadges[id] ?? []), { text: 'Throughput', className: BADGE_STYLES['Throughput'] }];
  }
  if (byJitter[0] && byJitter[0].id !== rankOne?.id && byJitter[0].id !== byP50[0]?.id) {
    const id = byJitter[0].id;
    decisionBadges[id] = [...(decisionBadges[id] ?? []), { text: 'Most Stable', className: BADGE_STYLES['Most Stable'] }];
  }
  if (bestFreeId) {
    const id = bestFreeId;
    decisionBadges[id] = [...(decisionBadges[id] ?? []), { text: 'Free', className: BADGE_STYLES['Free'] }];
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-25 inline ml-0.5" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-accent inline ml-0.5" />
      : <ChevronDown className="h-3 w-3 text-accent inline ml-0.5" />;
  }

  function Th({ col, label, align = 'right', title }: { col: SortKey; label: string; align?: 'left' | 'right'; title?: string }) {
    return (
      <th
        title={title}
        className={`py-3 px-3 text-${align} text-[10px] uppercase tracking-widest text-muted-foreground/55 font-semibold cursor-pointer select-none hover:text-muted-foreground transition-colors duration-150 whitespace-nowrap`}
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center gap-0.5">
          {label}<SortIcon col={col} />
          {title && <Info className="h-2.5 w-2.5 opacity-25 ml-0.5 cursor-help" />}
        </span>
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
      {/* Filter bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/35">
        <div className="flex items-center gap-1">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setTypeFilter(btn.key)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-150 ${
                typeFilter === btn.key
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {btn.label}
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                typeFilter === btn.key
                  ? 'bg-accent/20 text-accent'
                  : 'bg-muted/50 text-muted-foreground/60'
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-[10px] text-muted-foreground/40 font-mono">
            Jitter = P99−P50 · Value = score per $1/M
          </span>
          <span className="text-xs text-muted-foreground/45 font-mono">
            {filtered.length} of {providers.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-card border-b border-border/45 shadow-sm">
            <tr>
              <Th col="rank"           label="Rank"    align="left"  title="Overall rank by composite score" />
              <th className="py-3 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/55 font-semibold whitespace-nowrap">Type</th>
              <th className="py-3 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/55 font-semibold whitespace-nowrap">Provider</th>
              <Th col="latency_p50"    label="P50"     title="Median latency — 50th percentile response time" />
              <th className="py-3 px-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground/55 font-semibold whitespace-nowrap">Δ vs #1</th>
              <Th col="latency_p95"    label="P95"     title="95th percentile latency" />
              <Th col="latency_p99"    label="P99"     title="Tail latency — worst 1% of requests" />
              <Th col="jitter"         label="Jitter"  title="P99−P50: smaller = more consistent response times" />
              <Th col="uptime_percent" label="Uptime"  title="Measured availability across benchmark window" />
              <Th col="error_rate"     label="Err%"    title="Error rate: % of requests that failed" />
              <Th col="throughput_rps" label="RPS"     title="Peak throughput in concurrent requests/sec" />
              <th className="py-3 px-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground/55 font-semibold whitespace-nowrap">Slot</th>
              <Th col="cost"           label="$/M"     title="Cost per million API requests (USD) · 0 = free" />
              <Th col="value_score"    label="Value"   title="Score per $1/M cost — higher = more value for money. Free providers rank highest." />
              <Th col="score"          label="Score"   title="Composite score: latency 35% + uptime 35% + throughput 30%" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const delta      = p.metrics.latency_p50 - (leader?.metrics.latency_p50 ?? 0);
              const isLeader   = p.id === leader?.id;
              const isTopThree = p.rank <= 3;
              const isUs       = p.is_us;
              const badges     = decisionBadges[p.id] ?? [];
              const jitter     = p.metrics.latency_p99 - p.metrics.latency_p50;
              const vs         = valueScore(p);

              return (
                <tr
                  key={p.id}
                  className={`border-b border-border/15 transition-all duration-150 ${
                    onSelect ? 'cursor-pointer' : ''
                  } ${
                    isUs
                      ? 'bg-accent/[0.04] hover:bg-accent/[0.09]'
                      : isTopThree
                      ? 'hover:bg-muted/20'
                      : 'hover:bg-muted/10'
                  }`}
                  style={isUs ? { borderLeft: '2px solid color-mix(in oklch, var(--color-accent) 45%, transparent)' } : undefined}
                  onClick={() => onSelect?.(p)}
                >
                  {/* Rank */}
                  <td className="py-3 px-3"><RankBadge rank={p.rank} /></td>

                  {/* Type badge */}
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border tracking-wide ${TYPE_BADGE[p.provider_type]}`}>
                      {TYPE_LABEL[p.provider_type]}
                    </span>
                  </td>

                  {/* Provider name + badges */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isUs && (
                        <span className="text-[10px] font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded">★ US</span>
                      )}
                      <span className={`font-semibold text-sm ${isUs ? 'text-accent' : 'text-foreground'}`}>
                        {p.name}
                      </span>
                      {p.is_mock && (
                        <span className="text-[10px] text-muted-foreground/40">(sim)</span>
                      )}
                      {badges.map(badge => (
                        <span
                          key={badge.text}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* P50 with mini bar */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-10 h-[4px] bg-border/25 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (p.metrics.latency_p50 / maxP50) * 100)}%`,
                            backgroundColor: p.metrics.latency_p50 < 100
                              ? 'var(--color-accent)'
                              : p.metrics.latency_p50 < 300
                              ? 'var(--color-chart-3)'
                              : 'var(--color-destructive)',
                          }}
                        />
                      </div>
                      <span className={`font-mono tabular-nums font-semibold ${latencyColor(p.metrics.latency_p50)}`}>
                        {p.metrics.latency_p50}ms
                      </span>
                    </div>
                  </td>

                  {/* Delta vs leader */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {isLeader
                      ? <span className="text-accent/60 text-xs">—</span>
                      : <span className="text-muted-foreground/55 text-xs font-medium">+{delta}ms</span>
                    }
                  </td>

                  {/* P95 */}
                  <td className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${latencyColor(p.metrics.latency_p95)}`}>
                    {p.metrics.latency_p95}ms
                  </td>

                  {/* P99 */}
                  <td className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${latencyColor(p.metrics.latency_p99)}`}>
                    {p.metrics.latency_p99}ms
                  </td>

                  {/* Jitter (P99 - P50) */}
                  <td className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${jitterColor(jitter)}`}>
                    {jitter}ms
                  </td>

                  {/* Uptime */}
                  <td className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${uptimeColor(p.metrics.uptime_percent)}`}>
                    {p.metrics.uptime_percent.toFixed(1)}%
                  </td>

                  {/* Error rate */}
                  <td className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${errColor(p.metrics.error_rate)}`}>
                    {p.metrics.error_rate.toFixed(1)}%
                  </td>

                  {/* RPS */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-foreground/80">
                    {p.metrics.throughput_rps}
                  </td>

                  {/* Slot */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-muted-foreground/50">
                    {formatSlot(p.metrics.slot_height)}
                  </td>

                  {/* Cost/M */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {p.pricing.cost_per_million === 0
                      ? <span className="text-chart-2 font-semibold">Free</span>
                      : <span className="text-foreground/75">${p.pricing.cost_per_million}</span>
                    }
                  </td>

                  {/* Value score */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {p.pricing.cost_per_million === 0
                      ? <span className="text-chart-2 font-bold">∞</span>
                      : <span className="text-foreground/75 font-semibold">{Math.round(vs)}</span>
                    }
                  </td>

                  {/* Score bar */}
                  <td className="py-3 px-3 text-right">
                    <ScoreBar score={p.score} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-border/20 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { color: 'text-chart-2',     label: '< 50ms or ≥ 99.5%' },
            { color: 'text-chart-3',     label: '50–150ms or 98–99.5%' },
            { color: 'text-destructive', label: '> 150ms or < 98%' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`text-xs font-bold ${color}`}>■</span>
              <span className="text-[10px] text-muted-foreground/50">{label}</span>
            </span>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-muted-foreground/35 font-mono hidden md:block">
          Jitter = P99−P50 · Value = score÷($/M) · ★ US = GoldRush
        </span>
      </div>
    </div>
  );
}
