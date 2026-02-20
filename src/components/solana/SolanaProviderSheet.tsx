'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  provider: SolanaProvider | null;
  open: boolean;
  onClose: () => void;
  providers?: SolanaProvider[];
}

function MetricChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 border border-border/50 rounded-md px-3 py-2 min-w-[72px]">
      <span className="text-[10px] font-sans text-muted-foreground/70">{label}</span>
      <span className={`text-sm font-mono font-bold tabular-nums ${color ?? 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function CapBool({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-sans">
      <span className={value ? 'text-accent' : 'text-muted-foreground/40'}>{value ? '✓' : '✗'}</span>
      <span className={value ? 'text-foreground' : 'text-muted-foreground/60'}>{label}</span>
    </div>
  );
}

function latencyColor(ms: number) {
  if (ms < 100) return 'text-accent';
  if (ms < 300) return 'text-chart-3';
  return 'text-destructive';
}

function scoreColor(s: number) {
  if (s >= 85) return 'border-accent text-accent';
  if (s >= 70) return 'border-chart-3 text-chart-3';
  return 'border-destructive text-destructive';
}

const TYPE_LABELS: Record<string, string> = {
  'json-rpc': 'JSON-RPC',
  'rest-api': 'REST API',
  'data-api': 'Data API',
};

const TYPE_COLORS: Record<string, string> = {
  'json-rpc': 'bg-accent/15 text-accent border-accent/30',
  'rest-api': 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  'data-api': 'bg-destructive/15 text-destructive border-destructive/30',
};

function computeScoreComponents(p: SolanaProvider) {
  const latency    = +(Math.max(0, 100 - (p.metrics.latency_p50 / 1000) * 100) * 0.35).toFixed(1);
  const uptime     = +(p.metrics.uptime_percent * 0.35).toFixed(1);
  const throughput = +(Math.min(100, (p.metrics.throughput_rps / 500) * 100) * 0.30).toFixed(1);
  return { latency, uptime, throughput };
}

export function SolanaProviderSheet({ provider: p, open, onClose, providers }: Props) {
  const [showAllChains, setShowAllChains] = useState(false);

  if (!p) return null;

  const components = computeScoreComponents(p);
  const totalComponent = components.latency + components.uptime + components.throughput;

  // Latency spread bar
  const p50  = p.metrics.latency_p50;
  const p99  = p.metrics.latency_p99;
  const spread = p99 - p50;
  const p95gapPct  = p99 > 0 ? ((p.metrics.latency_p95 - p50) / p99) * 100 : 0;
  const p99gapPct  = p99 > 0 ? ((p99 - p.metrics.latency_p95) / p99) * 100 : 0;
  const p50Pct     = p99 > 0 ? (p50 / p99) * 100 : 100;

  // Chains
  const CHAIN_LIMIT = 8;
  const visibleChains = showAllChains ? p.supported_chains : p.supported_chains.slice(0, CHAIN_LIMIT);

  // Value rating
  const valueRating = p.pricing.cost_per_million > 0
    ? (p.score / p.pricing.cost_per_million).toFixed(0)
    : null;

  // Rank context
  const fasterCount = providers
    ? providers.filter(x => x.metrics.latency_p50 > p.metrics.latency_p50).length
    : null;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-[440px] sm:w-[440px] p-0 overflow-y-auto">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className={`text-sm font-sans font-semibold ${p.is_us ? 'text-accent' : 'text-foreground'}`}>
                  {p.is_us && <span className="mr-1">★</span>}{p.name}
                </SheetTitle>
                <Badge variant="outline" className={`text-[10px] font-sans px-1.5 h-5 border ${TYPE_COLORS[p.provider_type]}`}>
                  {TYPE_LABELS[p.provider_type]}
                </Badge>
                {p.is_mock && (
                  <Badge variant="outline" className="text-[10px] font-sans px-1.5 h-5 border-muted-foreground/30 text-muted-foreground/50">
                    simulated
                  </Badge>
                )}
              </div>
              <a
                href={p.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-sans text-muted-foreground hover:text-accent transition-colors"
              >
                {p.website_url.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>

              {/* Score breakdown bar */}
              <div className="mt-2 space-y-1">
                <div className="flex h-2 w-full rounded-full overflow-hidden">
                  <div style={{ width: `${(components.latency / totalComponent) * 100}%` }} className="bg-chart-1" />
                  <div style={{ width: `${(components.uptime / totalComponent) * 100}%` }} className="bg-chart-5" />
                  <div style={{ width: `${(components.throughput / totalComponent) * 100}%` }} className="bg-chart-2" />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-sans text-muted-foreground/70">
                  <span><span className="inline-block w-2 h-1.5 bg-chart-1 rounded-sm mr-1" />Lat <span className="font-mono">{components.latency.toFixed(1)}</span></span>
                  <span><span className="inline-block w-2 h-1.5 bg-chart-5 rounded-sm mr-1" />Up <span className="font-mono">{components.uptime.toFixed(1)}</span></span>
                  <span><span className="inline-block w-2 h-1.5 bg-chart-2 rounded-sm mr-1" />RPS <span className="font-mono">{components.throughput.toFixed(1)}</span></span>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-sm font-mono px-2 h-7 ${scoreColor(p.score)}`}
            >
              {p.score.toFixed(1)}
            </Badge>
          </div>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">
          {/* Latency spread */}
          <section className="space-y-2">
            <h3 className="text-xs font-sans font-semibold text-muted-foreground/80">Latency</h3>
            <div className="space-y-1">
              <div className="flex h-3 w-full rounded overflow-hidden">
                <div style={{ width: `${p50Pct}%` }}     className="bg-chart-1" />
                <div style={{ width: `${p95gapPct}%` }}  className="bg-chart-3" />
                <div style={{ width: `${p99gapPct}%` }}  className="bg-chart-4" />
              </div>
              <div className="flex items-center gap-3 text-[10px] font-sans text-muted-foreground/70">
                <span className="text-chart-1">■ P50</span>
                <span className="text-chart-3">■ P50→P95</span>
                <span className="text-chart-4">■ P95→P99</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <MetricChip label="P50"    value={`${p50}ms`}                      color={latencyColor(p50)} />
              <MetricChip label="P95"    value={`${p.metrics.latency_p95}ms`}    color={latencyColor(p.metrics.latency_p95)} />
              <MetricChip label="P99"    value={`${p99}ms`}                      color={latencyColor(p99)} />
              <MetricChip label="Spread" value={`${spread}ms`}                   color="text-muted-foreground" />
            </div>
          </section>

          {/* Reliability */}
          <section className="space-y-2">
            <h3 className="text-xs font-sans font-semibold text-muted-foreground/80">Reliability</h3>
            <div className="flex gap-2 flex-wrap">
              <MetricChip
                label="Uptime"
                value={`${p.metrics.uptime_percent.toFixed(1)}%`}
                color={p.metrics.uptime_percent >= 99.5 ? 'text-accent' : p.metrics.uptime_percent >= 98 ? 'text-chart-3' : 'text-destructive'}
              />
              <MetricChip
                label="Err Rate"
                value={`${p.metrics.error_rate.toFixed(1)}%`}
                color={p.metrics.error_rate < 1 ? 'text-accent' : p.metrics.error_rate < 5 ? 'text-chart-3' : 'text-destructive'}
              />
              <MetricChip label="Throughput" value={`${p.metrics.throughput_rps} rps`} color="text-primary" />
              {p.metrics.slot_height > 0 && (
                <MetricChip
                  label="Slot"
                  value={`${(p.metrics.slot_height / 1_000_000).toFixed(1)}M`}
                  color="text-muted-foreground"
                />
              )}
            </div>
            {providers && providers.length > 1 && (
              <p className="text-xs font-sans text-muted-foreground/65 mt-1">
                #{p.rank} of {providers.length} · Faster than {fasterCount} provider{fasterCount !== 1 ? 's' : ''}
              </p>
            )}
          </section>

          {/* Capabilities */}
          <section className="space-y-2">
            <h3 className="text-xs font-sans font-semibold text-muted-foreground/80">Capabilities</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <CapBool label="Transactions"   value={p.capabilities.transactions} />
              <CapBool label="Event Logs"     value={p.capabilities.logs} />
              <CapBool label="Token Balances" value={p.capabilities.token_balances} />
              <CapBool label="NFT Metadata"   value={p.capabilities.nft_metadata} />
              <CapBool label="Custom Indexing" value={p.capabilities.custom_indexing} />
              <CapBool label="Traces"         value={p.capabilities.traces} />
            </div>
            <p className="text-xs font-sans text-muted-foreground/65 mt-1">
              History depth: <span className="text-foreground">{p.capabilities.historical_depth}</span>
            </p>
          </section>

          {/* Pricing */}
          <section className="space-y-2">
            <h3 className="text-xs font-sans font-semibold text-muted-foreground/80">Pricing</h3>
            <div className="flex gap-4 text-sm font-sans">
              <div>
                <span className="text-muted-foreground/70">Cost / M req: </span>
                <span className={p.pricing.cost_per_million === 0 ? 'text-accent font-medium' : 'font-mono tabular-nums text-foreground'}>
                  {p.pricing.cost_per_million === 0 ? 'Free' : `$${p.pricing.cost_per_million}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground/70">Rate limit: </span>
                <span className="text-foreground font-mono">{p.pricing.rate_limit}</span>
              </div>
            </div>
            {valueRating && (
              <p className="text-xs font-sans text-muted-foreground/65">
                Value: <span className="text-chart-5 font-mono">{valueRating} pts per $1/M req</span>
              </p>
            )}
          </section>

          {/* Chains */}
          <section className="space-y-2">
            <h3 className="text-xs font-sans font-semibold text-muted-foreground/80">
              Supported Chains ({p.supported_chains.length})
            </h3>
            <div className="flex flex-wrap gap-1">
              {visibleChains.map(c => (
                <span key={c} className="text-[10px] font-sans px-1.5 py-0.5 border border-border/40 rounded text-muted-foreground/75">
                  {c}
                </span>
              ))}
            </div>
            {p.supported_chains.length > CHAIN_LIMIT && (
              <button
                onClick={() => setShowAllChains(v => !v)}
                className="text-xs font-sans text-accent hover:text-accent/80 transition-colors"
              >
                {showAllChains
                  ? '▲ Show less'
                  : `▼ +${p.supported_chains.length - CHAIN_LIMIT} more`}
              </button>
            )}
          </section>

          {/* Data quality note */}
          <section className="border-t border-border/40 pt-3">
            <p className={`text-xs font-sans ${p.is_mock ? 'text-chart-3/80' : 'text-accent/80'}`}>
              {p.is_mock
                ? '⚠ Simulated data — add API key for live measurements'
                : '✓ Live data — measurements from real API calls'}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
