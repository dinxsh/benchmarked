'use client';

import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

// Boolean capability keys counted in Cap. Score row
const BOOL_KEYS: (keyof SolanaProvider['capabilities'])[] = [
  'transactions', 'logs', 'token_balances', 'nft_metadata', 'custom_indexing', 'traces',
];

const FEATURES = [
  { key: 'provider_type', label: 'Type', render: (p: SolanaProvider) => (
    <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded ${
      p.provider_type === 'json-rpc' ? 'bg-accent/15 text-accent' :
      p.provider_type === 'rest-api' ? 'bg-chart-3/15 text-chart-3' :
      'bg-destructive/15 text-destructive'
    }`}>
      {p.provider_type === 'json-rpc' ? 'RPC' : p.provider_type === 'rest-api' ? 'REST' : 'Data'}
    </span>
  )},
  { key: 'transactions',   label: 'Transactions',   render: (p: SolanaProvider) => bool(p.capabilities.transactions) },
  { key: 'logs',           label: 'Event Logs',      render: (p: SolanaProvider) => bool(p.capabilities.logs) },
  { key: 'token_balances', label: 'Token Balances',  render: (p: SolanaProvider) => bool(p.capabilities.token_balances) },
  { key: 'nft_metadata',   label: 'NFT Metadata',    render: (p: SolanaProvider) => bool(p.capabilities.nft_metadata) },
  { key: 'custom_indexing',label: 'Custom Indexing', render: (p: SolanaProvider) => bool(p.capabilities.custom_indexing) },
  { key: 'traces',         label: 'Traces',          render: (p: SolanaProvider) => bool(p.capabilities.traces) },
  { key: 'historical_depth', label: 'History Depth', render: (p: SolanaProvider) => (
    <span className="text-muted-foreground">{p.capabilities.historical_depth}</span>
  )},
  { key: 'cost', label: 'Cost / M Req', render: (p: SolanaProvider) => (
    <span className={p.pricing.cost_per_million === 0 ? 'text-accent' : 'text-foreground'}>
      {p.pricing.cost_per_million === 0 ? 'Free' : `$${p.pricing.cost_per_million}`}
    </span>
  )},
  { key: 'rate_limit', label: 'Rate Limit', render: (p: SolanaProvider) => (
    <span className="text-muted-foreground">{p.pricing.rate_limit}</span>
  )},
] as const;

function bool(v: boolean) {
  return v ? (
    <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-accent/15 text-accent font-bold text-[11px]">✓</span>
  ) : (
    <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-muted/20 text-muted-foreground/30 text-[11px]">✗</span>
  );
}

const TYPE_SUB: Record<string, { label: string; color: string }> = {
  'json-rpc': { label: 'RPC',  color: 'text-accent/60' },
  'rest-api': { label: 'REST', color: 'text-chart-3/60' },
  'data-api': { label: 'Data', color: 'text-destructive/60' },
};

export function SolanaCapabilitiesMatrix({ providers }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] font-mono border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-2 px-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium sticky left-0 bg-muted/30 min-w-[130px]">
              Feature
            </th>
            {providers.map(p => {
              const sub = TYPE_SUB[p.provider_type];
              return (
                <th key={p.id} className="py-2 px-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium min-w-[88px]">
                  <span className={p.is_us ? 'text-accent' : 'text-muted-foreground'}>
                    {p.name}
                  </span>
                  <span className={`block text-[8px] normal-case tracking-normal font-normal ${sub.color}`}>
                    {sub.label}
                  </span>
                  {p.is_mock && <span className="block text-[8px] text-muted-foreground/40 normal-case">sim</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map(({ key, label, render }) => (
            <tr key={key} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="py-2 px-3 text-muted-foreground sticky left-0 bg-background text-[10px] uppercase tracking-wider">
                {label}
              </td>
              {providers.map(p => (
                <td key={p.id} className="py-2 px-2 text-center">
                  {render(p)}
                </td>
              ))}
            </tr>
          ))}
          {/* Capability Score totals row */}
          <tr className="border-t-2 border-border bg-muted/20">
            <td className="py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground sticky left-0 bg-muted/20 font-medium">
              Cap. Score
            </td>
            {providers.map(p => {
              const trueCount = BOOL_KEYS.filter(k => p.capabilities[k] as unknown as boolean).length;
              const pct = Math.round((trueCount / BOOL_KEYS.length) * 100);
              return (
                <td key={p.id} className="py-2 px-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={pct >= 80 ? 'bg-accent h-full' : pct >= 50 ? 'bg-chart-3 h-full' : 'bg-destructive h-full'}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[9px] tabular-nums ${pct >= 80 ? 'text-accent' : pct >= 50 ? 'text-chart-3' : 'text-destructive'}`}>
                      {pct}%
                    </span>
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
