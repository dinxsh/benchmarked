'use client';

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
}

function MetricChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 border border-border rounded px-3 py-2 min-w-[72px]">
      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-[13px] font-mono font-bold tabular-nums ${color ?? 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function CapBool({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono">
      <span className={value ? 'text-accent' : 'text-muted-foreground/40'}>{value ? '✓' : '✗'}</span>
      <span className={value ? 'text-foreground' : 'text-muted-foreground/60'}>{label}</span>
    </div>
  );
}

function latencyColor(ms: number) {
  if (ms < 100) return 'text-accent';
  if (ms < 300) return 'text-yellow-400';
  return 'text-destructive';
}

function scoreColor(s: number) {
  if (s >= 85) return 'border-accent text-accent';
  if (s >= 70) return 'border-yellow-400 text-yellow-400';
  return 'border-destructive text-destructive';
}

const TYPE_LABELS: Record<string, string> = {
  'json-rpc': 'JSON-RPC',
  'rest-api': 'REST API',
  'data-api': 'Data API',
};

const TYPE_COLORS: Record<string, string> = {
  'json-rpc': 'bg-accent/15 text-accent border-accent/30',
  'rest-api': 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',
  'data-api': 'bg-destructive/15 text-destructive border-destructive/30',
};

export function SolanaProviderSheet({ provider: p, open, onClose }: Props) {
  if (!p) return null;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-[440px] sm:w-[440px] font-mono p-0 overflow-y-auto">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className={`text-sm font-mono font-bold ${p.is_us ? 'text-accent' : 'text-foreground'}`}>
                  {p.is_us && <span className="mr-1">★</span>}{p.name}
                </SheetTitle>
                <Badge variant="outline" className={`text-[9px] font-mono px-1.5 h-4 border ${TYPE_COLORS[p.provider_type]}`}>
                  {TYPE_LABELS[p.provider_type]}
                </Badge>
                {p.is_mock && (
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 h-4 border-muted-foreground/30 text-muted-foreground/50">
                    simulated
                  </Badge>
                )}
              </div>
              <a
                href={p.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors"
              >
                {p.website_url.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
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
          {/* Latency */}
          <section className="space-y-2">
            <h3 className="text-[9px] uppercase tracking-wider text-muted-foreground">Latency</h3>
            <div className="flex gap-2 flex-wrap">
              <MetricChip label="P50" value={`${p.metrics.latency_p50}ms`} color={latencyColor(p.metrics.latency_p50)} />
              <MetricChip label="P95" value={`${p.metrics.latency_p95}ms`} color={latencyColor(p.metrics.latency_p95)} />
              <MetricChip label="P99" value={`${p.metrics.latency_p99}ms`} color={latencyColor(p.metrics.latency_p99)} />
            </div>
          </section>

          {/* Reliability */}
          <section className="space-y-2">
            <h3 className="text-[9px] uppercase tracking-wider text-muted-foreground">Reliability</h3>
            <div className="flex gap-2 flex-wrap">
              <MetricChip
                label="Uptime"
                value={`${p.metrics.uptime_percent.toFixed(1)}%`}
                color={p.metrics.uptime_percent >= 99.5 ? 'text-accent' : p.metrics.uptime_percent >= 98 ? 'text-yellow-400' : 'text-destructive'}
              />
              <MetricChip
                label="Err Rate"
                value={`${p.metrics.error_rate.toFixed(1)}%`}
                color={p.metrics.error_rate < 1 ? 'text-accent' : p.metrics.error_rate < 5 ? 'text-yellow-400' : 'text-destructive'}
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
          </section>

          {/* Capabilities */}
          <section className="space-y-2">
            <h3 className="text-[9px] uppercase tracking-wider text-muted-foreground">Capabilities</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <CapBool label="Transactions" value={p.capabilities.transactions} />
              <CapBool label="Event Logs" value={p.capabilities.logs} />
              <CapBool label="Token Balances" value={p.capabilities.token_balances} />
              <CapBool label="NFT Metadata" value={p.capabilities.nft_metadata} />
              <CapBool label="Custom Indexing" value={p.capabilities.custom_indexing} />
              <CapBool label="Traces" value={p.capabilities.traces} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              History depth: <span className="text-foreground">{p.capabilities.historical_depth}</span>
            </p>
          </section>

          {/* Pricing */}
          <section className="space-y-2">
            <h3 className="text-[9px] uppercase tracking-wider text-muted-foreground">Pricing</h3>
            <div className="flex gap-4 text-[11px]">
              <div>
                <span className="text-muted-foreground">Cost / M req: </span>
                <span className={p.pricing.cost_per_million === 0 ? 'text-accent font-medium' : 'text-foreground'}>
                  {p.pricing.cost_per_million === 0 ? 'Free' : `$${p.pricing.cost_per_million}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Rate limit: </span>
                <span className="text-foreground">{p.pricing.rate_limit}</span>
              </div>
            </div>
          </section>

          {/* Chains */}
          <section className="space-y-2">
            <h3 className="text-[9px] uppercase tracking-wider text-muted-foreground">Supported Chains</h3>
            <div className="flex flex-wrap gap-1">
              {p.supported_chains.slice(0, 8).map(c => (
                <span key={c} className="text-[9px] font-mono px-1.5 py-0.5 border border-border rounded text-muted-foreground">
                  {c}
                </span>
              ))}
              {p.supported_chains.length > 8 && (
                <span className="text-[9px] font-mono text-muted-foreground/50">
                  +{p.supported_chains.length - 8} more
                </span>
              )}
            </div>
          </section>

          {/* Data quality note */}
          <section className="border-t border-border/50 pt-3">
            <p className={`text-[10px] font-mono ${p.is_mock ? 'text-yellow-400/70' : 'text-accent/70'}`}>
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
