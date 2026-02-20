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
  if (ms < 100) return 'text-emerald-500';
  if (ms < 400) return 'text-amber-500';
  return 'text-red-500';
}

function uptimeColor(pct: number): string {
  if (pct >= 99) return 'text-emerald-500';
  if (pct >= 80) return 'text-amber-500';
  return 'text-red-500';
}

function errColor(pct: number): string {
  if (pct === 0) return 'text-emerald-500';
  if (pct < 20)  return 'text-amber-500';
  return 'text-red-500';
}

function jitterColor(ms: number): string {
  if (ms < 60)  return 'text-emerald-500';
  if (ms < 200) return 'text-amber-500';
  return 'text-red-500';
}

function valueScore(p: SolanaProvider): number {
  if (p.pricing.cost_per_million === 0) return 999_999;
  return p.score / p.pricing.cost_per_million;
}

function formatSlot(slot: number): string {
  if (!slot) return '—';
  return `${(slot / 1_000_000).toFixed(1)}M`;
}

// ─── Rank badge ────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/15 text-amber-400 text-sm font-extrabold tabular-nums">
      1
    </span>
  );
  if (rank === 2) return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/40 text-foreground/70 text-sm font-bold tabular-nums">
      2
    </span>
  );
  if (rank === 3) return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/30 text-foreground/60 text-sm font-bold tabular-nums">
      3
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold tabular-nums text-muted-foreground">
      {rank}
    </span>
  );
}

// ─── Type badge ────────────────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, string> = {
  'json-rpc': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'rest-api': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'data-api': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};
const TYPE_LABEL: Record<string, string> = {
  'json-rpc': 'RPC',
  'rest-api': 'REST',
  'data-api': 'Data',
};

// ─── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const textCls = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  return (
    <div className="flex items-center gap-2.5 justify-end">
      <div className="w-16 h-1.5 bg-border/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className={`${textCls} font-mono tabular-nums text-sm font-bold w-10 text-right`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Decision badges ───────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  'Best Overall': 'bg-amber-400/10 text-amber-400 border-amber-400/25',
  'Fastest':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Throughput':   'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Most Stable':  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Free':         'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

interface DecisionBadge { text: string; className: string; }

// ─── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 opacity-30 inline ml-0.5" />;
  return dir === 'asc'
    ? <ChevronUp className="h-3 w-3 text-accent inline ml-0.5" />
    : <ChevronDown className="h-3 w-3 text-accent inline ml-0.5" />;
}

// ─── Main component ────────────────────────────────────────────────────────────
export function SolanaLeaderboardTable({ providers, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      const ascFirst: SortKey[] = ['latency_p50', 'latency_p95', 'latency_p99', 'error_rate', 'jitter', 'cost', 'rank'];
      setSortDir(ascFirst.includes(key) ? 'asc' : 'desc');
    }
  }

  const filtered = typeFilter === 'all' ? providers : providers.filter(p => p.provider_type === typeFilter);

  const sorted = [...filtered].sort((a, b) => {
    let av: number, bv: number;
    switch (sortKey) {
      case 'rank':           av = a.rank;                                         bv = b.rank;                                         break;
      case 'latency_p50':    av = a.metrics.latency_p50;                          bv = b.metrics.latency_p50;                          break;
      case 'latency_p95':    av = a.metrics.latency_p95;                          bv = b.metrics.latency_p95;                          break;
      case 'latency_p99':    av = a.metrics.latency_p99;                          bv = b.metrics.latency_p99;                          break;
      case 'uptime_percent': av = a.metrics.uptime_percent;                       bv = b.metrics.uptime_percent;                       break;
      case 'error_rate':     av = a.metrics.error_rate;                           bv = b.metrics.error_rate;                           break;
      case 'throughput_rps': av = a.metrics.throughput_rps;                       bv = b.metrics.throughput_rps;                       break;
      case 'score':          av = a.score;                                         bv = b.score;                                         break;
      case 'jitter':         av = a.metrics.latency_p99 - a.metrics.latency_p50; bv = b.metrics.latency_p99 - b.metrics.latency_p50; break;
      case 'cost':           av = a.pricing.cost_per_million;                     bv = b.pricing.cost_per_million;                     break;
      case 'value_score':    av = valueScore(a);                                  bv = valueScore(b);                                  break;
      default:               av = a.rank;                                         bv = b.rank;
    }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const maxP50 = Math.max(...providers.map(p => p.metrics.latency_p50), 1);
  const leader = providers.reduce((best, p) => p.metrics.latency_p50 < best.metrics.latency_p50 ? p : best, providers[0]);

  // Decision badges (provider-neutral)
  const rankOne  = providers.find(p => p.rank === 1);
  const byP50    = [...providers].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50);
  const byRps    = [...providers].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps);
  const byJitter = [...providers].sort((a, b) =>
    (a.metrics.latency_p99 - a.metrics.latency_p50) - (b.metrics.latency_p99 - b.metrics.latency_p50)
  );
  const frees      = providers.filter(p => p.pricing.cost_per_million === 0);
  const bestFreeId = frees.length > 0 ? frees.reduce((a, b) => a.score > b.score ? a : b).id : null;

  const decisionBadges: Record<string, DecisionBadge[]> = {};
  if (rankOne) decisionBadges[rankOne.id] = [{ text: 'Best Overall', className: BADGE_STYLES['Best Overall'] }];
  if (byP50[0] && byP50[0].id !== rankOne?.id) {
    decisionBadges[byP50[0].id] = [...(decisionBadges[byP50[0].id] ?? []), { text: 'Fastest', className: BADGE_STYLES['Fastest'] }];
  }
  if (byRps[0] && byRps[0].id !== rankOne?.id) {
    decisionBadges[byRps[0].id] = [...(decisionBadges[byRps[0].id] ?? []), { text: 'Throughput', className: BADGE_STYLES['Throughput'] }];
  }
  if (byJitter[0] && byJitter[0].id !== rankOne?.id && byJitter[0].id !== byP50[0]?.id) {
    decisionBadges[byJitter[0].id] = [...(decisionBadges[byJitter[0].id] ?? []), { text: 'Most Stable', className: BADGE_STYLES['Most Stable'] }];
  }
  if (bestFreeId) {
    decisionBadges[bestFreeId] = [...(decisionBadges[bestFreeId] ?? []), { text: 'Free', className: BADGE_STYLES['Free'] }];
  }

  function Th({
    col, label, align = 'right', title,
  }: { col: SortKey; label: string; align?: 'left' | 'right'; title?: string }) {
    const active = sortKey === col;
    return (
      <th
        title={title}
        className={`py-3 px-3 text-${align} text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors duration-150 ${
          active ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
        }`}
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon active={active} dir={sortDir} />
      </th>
    );
  }

  const filterButtons: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all',      label: 'All Providers', count: providers.length },
    { key: 'json-rpc', label: 'JSON-RPC',       count: providers.filter(p => p.provider_type === 'json-rpc').length },
    { key: 'rest-api', label: 'REST API',        count: providers.filter(p => p.provider_type === 'rest-api').length },
    { key: 'data-api', label: 'Data API',        count: providers.filter(p => p.provider_type === 'data-api').length },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/[0.02]">
        <div className="flex items-center gap-1">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setTypeFilter(btn.key)}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 ${
                typeFilter === btn.key
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {btn.label}
              <span className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                typeFilter === btn.key
                  ? 'bg-white/20 text-accent-foreground'
                  : 'bg-muted/60 text-muted-foreground/70'
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground/50 font-mono hidden md:block">
          Jitter = P99−P50 · Value = score÷($/M)
        </span>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b-2 border-border/50">
            <tr>
              <th className="py-3 px-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/60 w-14">Rank</th>
              <th className="py-3 px-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Type</th>
              <th className="py-3 px-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Provider</th>
              <Th col="latency_p50"    label="P50"    title="Median latency — 50th percentile response time" />
              <th className="py-3 px-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Δ Lead</th>
              <Th col="latency_p95"    label="P95"    title="95th percentile latency" />
              <Th col="latency_p99"    label="P99"    title="Tail latency — worst 1% of requests" />
              <Th col="jitter"         label="Jitter" title="P99−P50: lower = more consistent response times" />
              <Th col="uptime_percent" label="Uptime" title="Request success rate in measurement window" />
              <Th col="error_rate"     label="Err%"   title="Percentage of requests that failed" />
              <Th col="throughput_rps" label="RPS"    title="Peak concurrent requests per second" />
              <th className="py-3 px-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Slot</th>
              <Th col="cost"           label="$/M"    title="Cost per million API requests (USD) · Free = $0" />
              <Th col="value_score"    label="Value"  title="Score per $1/M cost — ∞ for free providers" />
              <Th col="score"          label="Score"  title="Composite: latency 40% + reliability 35% + throughput 25%" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {sorted.map((p) => {
              const delta    = p.metrics.latency_p50 - (leader?.metrics.latency_p50 ?? 0);
              const isLeader = p.id === leader?.id;
              const badges   = decisionBadges[p.id] ?? [];
              const jitter   = p.metrics.latency_p99 - p.metrics.latency_p50;
              const vs       = valueScore(p);
              const isTop3   = p.rank <= 3;

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect?.(p)}
                  className={`transition-colors duration-100 ${
                    onSelect ? 'cursor-pointer' : ''
                  } ${isTop3 ? 'hover:bg-muted/25' : 'hover:bg-muted/15'}`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-3">
                    <RankBadge rank={p.rank} />
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-3">
                    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border ${TYPE_BADGE[p.provider_type]}`}>
                      {TYPE_LABEL[p.provider_type]}
                    </span>
                  </td>

                  {/* Provider name + badges */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-foreground leading-none">{p.name}</span>
                      {p.is_mock && (
                        <span className="text-xs text-muted-foreground/40 font-mono">(sim)</span>
                      )}
                      {badges.map(badge => (
                        <span key={badge.text} className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.className}`}>
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* P50 with mini bar */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="w-12 h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (p.metrics.latency_p50 / maxP50) * 100)}%`,
                            backgroundColor: p.metrics.latency_p50 < 100 ? '#22c55e'
                              : p.metrics.latency_p50 < 400 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className={`font-mono tabular-nums font-bold text-sm ${latencyColor(p.metrics.latency_p50)}`}>
                        {p.metrics.latency_p50}ms
                      </span>
                    </div>
                  </td>

                  {/* Delta vs leader */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-sm">
                    {isLeader
                      ? <span className="text-emerald-500/70 font-bold">—</span>
                      : <span className="text-muted-foreground/50">+{delta}ms</span>
                    }
                  </td>

                  {/* P95 */}
                  <td className={`py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm ${latencyColor(p.metrics.latency_p95)}`}>
                    {p.metrics.latency_p95}ms
                  </td>

                  {/* P99 */}
                  <td className={`py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm ${latencyColor(p.metrics.latency_p99)}`}>
                    {p.metrics.latency_p99}ms
                  </td>

                  {/* Jitter */}
                  <td className={`py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm ${jitterColor(jitter)}`}>
                    {jitter}ms
                  </td>

                  {/* Uptime */}
                  <td className={`py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm ${uptimeColor(p.metrics.uptime_percent)}`}>
                    {p.metrics.uptime_percent.toFixed(0)}%
                  </td>

                  {/* Error rate */}
                  <td className={`py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm ${errColor(p.metrics.error_rate)}`}>
                    {p.metrics.error_rate.toFixed(0)}%
                  </td>

                  {/* RPS */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm text-foreground/90">
                    {p.metrics.throughput_rps}
                  </td>

                  {/* Slot */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-sm text-muted-foreground/50">
                    {formatSlot(p.metrics.slot_height)}
                  </td>

                  {/* Cost/M */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-sm font-bold">
                    {p.pricing.cost_per_million === 0
                      ? <span className="text-emerald-500">Free</span>
                      : <span className="text-foreground/75">${p.pricing.cost_per_million}</span>
                    }
                  </td>

                  {/* Value score */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-sm font-bold">
                    {p.pricing.cost_per_million === 0
                      ? <span className="text-emerald-500">∞</span>
                      : <span className="text-foreground/70">{Math.round(vs)}</span>
                    }
                  </td>

                  {/* Score bar */}
                  <td className="py-3.5 px-3">
                    <ScoreBar score={p.score} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="px-5 py-3 border-t border-border/30 bg-muted/[0.02] flex items-center gap-5 flex-wrap">
        {[
          { color: 'bg-emerald-500', label: 'Good' },
          { color: 'bg-amber-500',   label: 'Moderate' },
          { color: 'bg-red-500',     label: 'Poor' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-muted-foreground/60">{label}</span>
          </span>
        ))}
        <span className="ml-auto text-xs text-muted-foreground/40 font-mono hidden lg:block">
          click any row for full provider details
        </span>
      </div>
    </div>
  );
}
