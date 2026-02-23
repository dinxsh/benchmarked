'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS, TYPE_LABELS, TYPE_COLORS } from '@/lib/benchmark/data';
import { computeValueScore, computeDelta } from '@/lib/benchmark/scoring';

const C = GR_COLORS;

type SortKey =
  | 'rank' | 'p50' | 'p95' | 'p99' | 'jitter'
  | 'uptime' | 'errRate' | 'rps' | 'costPerM' | 'value' | 'score';

type TypeFilter = 'all' | 'json-rpc' | 'rest-api' | 'data-api';

interface Props {
  providers: GRProvider[];
  onSelect: (p: GRProvider) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown size={11} style={{ opacity: 0.3, display: 'inline', marginLeft: 3 }} />;
  return dir === 'asc'
    ? <ChevronUp size={11} style={{ color: C.blue, display: 'inline', marginLeft: 3 }} />
    : <ChevronDown size={11} style={{ color: C.blue, display: 'inline', marginLeft: 3 }} />;
}

function latencyColor(ms: number): string {
  if (ms <= 20)  return C.green;
  if (ms <= 100) return C.amber;
  return C.red;
}
function p9xColor(ms: number): string { return ms <= 300 ? C.amber : C.red; }
function jitterColor(ms: number): string {
  if (ms <= 150) return C.green;
  if (ms <= 400) return C.amber;
  return C.red;
}
function uptimeColor(pct: number): string {
  if (pct >= 99) return C.green;
  if (pct >= 95) return C.amber;
  return C.red;
}

function TypeBadge({ type }: { type: GRProvider['type'] }) {
  const tc = TYPE_COLORS[type];
  return (
    <span style={{
      background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
      borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: GR_FONTS.mono,
      whiteSpace: 'nowrap',
    }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? C.green : score >= 60 ? C.amber : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
      <div style={{ width: 56, height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: C.amber,
        fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right' }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Best Overall': { bg: 'rgba(245,166,35,0.12)', color: C.amber,  border: 'rgba(245,166,35,0.3)' },
  'Best Value':   { bg: 'rgba(245,197,24,0.12)', color: C.gold,   border: 'rgba(245,197,24,0.3)' },
  'Fastest':      { bg: 'rgba(16,185,129,0.10)', color: C.green,  border: 'rgba(16,185,129,0.25)' },
  'Throughput':   { bg: 'rgba(59,130,246,0.10)', color: C.blue,   border: 'rgba(59,130,246,0.25)' },
  'Most Stable':  { bg: 'rgba(139,92,246,0.10)', color: C.purple, border: 'rgba(139,92,246,0.25)' },
  'Free':         { bg: 'rgba(16,185,129,0.08)', color: C.green,  border: 'rgba(16,185,129,0.2)'  },
};

function DecisionBadge({ text }: { text: string }) {
  const s = BADGE_STYLES[text] ?? BADGE_STYLES['Free'];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.04em', fontFamily: GR_FONTS.mono, whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

export function GRProviderTable({ providers, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const leader = useMemo(() =>
    providers.reduce((best, p) => p.p50 < best.p50 ? p : best, providers[0]),
    [providers]);

  const decisionMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const byScore  = [...providers].sort((a, b) => b.score - a.score);
    const byP50    = [...providers].sort((a, b) => a.p50 - b.p50);
    const byRps    = [...providers].sort((a, b) => b.rps - a.rps);
    const byJitter = [...providers].sort((a, b) => a.jitter - b.jitter);
    const paid     = providers.filter((p) => p.costPerM > 0);
    const bestValuePaid = paid.length > 0
      ? paid.reduce((a, b) => computeValueScore(a) > computeValueScore(b) ? a : b)
      : null;

    if (byScore[0])      (map[byScore[0].id]  ??= []).push('Best Overall');
    if (byP50[0] && byP50[0].id !== byScore[0]?.id)
      (map[byP50[0].id] ??= []).push('Fastest');
    if (byRps[0] && byRps[0].id !== byScore[0]?.id)
      (map[byRps[0].id] ??= []).push('Throughput');
    if (byJitter[0] && byJitter[0].id !== byScore[0]?.id && byJitter[0].id !== byP50[0]?.id)
      (map[byJitter[0].id] ??= []).push('Most Stable');
    if (bestValuePaid) (map[bestValuePaid.id] ??= []).push('Best Value');
    providers.filter((p) => p.free).forEach((p) => (map[p.id] ??= []).push('Free'));

    return map;
  }, [providers]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(['p50', 'p95', 'p99', 'jitter', 'errRate', 'costPerM', 'rank'].includes(key) ? 'asc' : 'desc');
    }
  }

  const filtered = typeFilter === 'all' ? providers : providers.filter((p) => p.type === typeFilter);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case 'rank':    av = a.rank;          bv = b.rank;          break;
        case 'p50':     av = a.p50;           bv = b.p50;           break;
        case 'p95':     av = a.p95;           bv = b.p95;           break;
        case 'p99':     av = a.p99;           bv = b.p99;           break;
        case 'jitter':  av = a.jitter;        bv = b.jitter;        break;
        case 'uptime':  av = a.uptime;        bv = b.uptime;        break;
        case 'errRate': av = a.errRate;       bv = b.errRate;       break;
        case 'rps':     av = a.rps;           bv = b.rps;           break;
        case 'costPerM':av = a.costPerM;      bv = b.costPerM;      break;
        case 'value':   av = computeValueScore(a); bv = computeValueScore(b); break;
        case 'score':   av = a.score;         bv = b.score;         break;
        default:        av = a.score;         bv = b.score;
      }
      if (!isFinite(av)) av = 999999;
      if (!isFinite(bv)) bv = 999999;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const thStyle = (active: boolean): React.CSSProperties => ({
    padding: '11px 10px', textAlign: 'right' as const,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontFamily: GR_FONTS.mono, cursor: 'pointer', userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const, borderBottom: `1px solid ${C.border}`,
    color: active ? C.textPrimary : C.textMuted,
    transition: 'color 150ms',
  });

  const thLeftStyle = (active: boolean): React.CSSProperties => ({
    ...thStyle(active), textAlign: 'left' as const,
  });

  function Th({ col, label, align = 'right' }: { col: SortKey; label: string; align?: 'left' | 'right' }) {
    const active = sortKey === col;
    return (
      <th style={align === 'left' ? thLeftStyle(active) : thStyle(active)} onClick={() => handleSort(col)}>
        {label}<SortIcon active={active} dir={sortDir} />
      </th>
    );
  }

  const filterBtns: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all',      label: `All Providers ${providers.length}`,              count: providers.length },
    { key: 'json-rpc', label: `JSON-RPC ${providers.filter((p) => p.type === 'json-rpc').length}`, count: providers.filter((p) => p.type === 'json-rpc').length },
    { key: 'rest-api', label: `REST API ${providers.filter((p) => p.type === 'rest-api').length}`,  count: providers.filter((p) => p.type === 'rest-api').length },
    { key: 'data-api', label: `Data API ${providers.filter((p) => p.type === 'data-api').length}`,  count: providers.filter((p) => p.type === 'data-api').length },
  ];

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: GR_FONTS.mono }}>
            Full Provider Comparison
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, marginTop: 3 }}>
            {providers.length} providers · click any row for full details · sortable columns
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
          Jitter = P99−P50 · Value = score÷($/M)
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filterBtns.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setTypeFilter(btn.key)}
            style={{
              padding: '4px 11px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: GR_FONTS.mono, border: `1px solid ${typeFilter === btn.key ? C.borderBright : C.border}`,
              background: typeFilter === btn.key ? C.borderBright : 'transparent',
              color: typeFilter === btn.key ? C.textPrimary : C.textMuted,
              transition: 'all 150ms',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bgBase }}>
              <th style={{ ...thLeftStyle(sortKey === 'rank'), width: 52 }} onClick={() => handleSort('rank')}>
                RANK<SortIcon active={sortKey === 'rank'} dir={sortDir} />
              </th>
              <th style={{ ...thLeftStyle(false), cursor: 'default' }}>TYPE</th>
              <th style={{ ...thLeftStyle(false), cursor: 'default' }}>PROVIDER</th>
              <Th col="p50"    label="P50" />
              <th style={thStyle(false)}>Δ LEAD</th>
              <Th col="p95"    label="P95" />
              <Th col="p99"    label="P99" />
              <Th col="jitter" label="JITTER" />
              <Th col="uptime" label="UPTIME" />
              <Th col="errRate" label="ERR%" />
              <Th col="rps"    label="RPS" />
              <th style={thStyle(false)}>SLOT</th>
              <Th col="costPerM" label="$/M" />
              <Th col="value"  label="VALUE" />
              <Th col="score"  label="SCORE" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const delta    = computeDelta(p, leader);
              const isLeader = p.id === leader?.id;
              const badges   = decisionMap[p.id] ?? [];
              const vs       = computeValueScore(p);

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    transition: 'background 100ms',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = C.bgCardHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  {/* Rank */}
                  <td style={{ padding: '9px 10px' }}>
                    {p.rank === 1 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.15)',
                        color: C.blue, fontSize: 13, fontWeight: 900, fontFamily: GR_FONTS.mono }}>
                        1
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted,
                        fontFamily: GR_FONTS.mono, paddingLeft: 6 }}>
                        {p.rank}
                      </span>
                    )}
                  </td>
                  {/* Type */}
                  <td style={{ padding: '9px 10px' }}>
                    <TypeBadge type={p.type} />
                  </td>
                  {/* Provider + badges */}
                  <td style={{ padding: '9px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 800,
                        color: C.textPrimary,
                        fontFamily: GR_FONTS.mono }}>
                        {p.name}
                      </span>
                      {badges.map((b) => <DecisionBadge key={b} text={b} />)}
                    </div>
                  </td>
                  {/* P50 */}
                  <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: latencyColor(p.p50),
                      fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(p.p50)}ms
                    </span>
                  </td>
                  {/* Δ Lead */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11,
                    fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {isLeader
                      ? <span style={{ color: C.green, fontWeight: 700 }}>—</span>
                      : <span style={{ color: C.textMuted }}>+{Math.round(delta)}ms</span>
                    }
                  </td>
                  {/* P95 */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                    color: p9xColor(p.p95), fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(p.p95)}ms
                  </td>
                  {/* P99 */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                    color: p9xColor(p.p99), fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(p.p99)}ms
                  </td>
                  {/* Jitter */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                    color: jitterColor(p.jitter), fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(p.jitter)}ms
                  </td>
                  {/* Uptime */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                    color: uptimeColor(p.uptime), fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {p.uptime.toFixed(0)}%
                  </td>
                  {/* Err% */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                    color: p.errRate === 0 ? C.green : C.red,
                    fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {p.errRate.toFixed(0)}%
                  </td>
                  {/* RPS */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                    color: C.textPrimary, fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(p.rps)}
                  </td>
                  {/* Slot */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11,
                    color: C.textMuted, fontFamily: GR_FONTS.mono }}>
                    {p.slot ? `${(p.slot / 1e6).toFixed(1)}M` : '—'}
                  </td>
                  {/* Cost/M */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 800,
                    fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {p.free
                      ? <span style={{ color: C.green }}>Free</span>
                      : <span style={{ color: C.textPrimary }}>${p.costPerM}</span>
                    }
                  </td>
                  {/* Value */}
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                    fontFamily: GR_FONTS.mono, fontVariantNumeric: 'tabular-nums' }}>
                    {p.free
                      ? <span style={{ color: C.green }}>∞</span>
                      : <span style={{ color: C.textSecondary }}>{Math.round(vs)}</span>
                    }
                  </td>
                  {/* Score */}
                  <td style={{ padding: '9px 10px' }}>
                    <ScoreBar score={p.score} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { color: C.green, label: 'Good' },
          { color: C.amber, label: 'Moderate' },
          { color: C.red,   label: 'Poor' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
          REST and Data API measured differently from JSON-RPC
        </span>
      </div>
    </div>
  );
}
