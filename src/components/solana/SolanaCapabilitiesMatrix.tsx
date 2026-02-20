'use client';

import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

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
  { key: 'transactions', label: 'Transactions', render: (p: SolanaProvider) => bool(p.capabilities.transactions) },
  { key: 'logs', label: 'Event Logs', render: (p: SolanaProvider) => bool(p.capabilities.logs) },
  { key: 'token_balances', label: 'Token Balances', render: (p: SolanaProvider) => bool(p.capabilities.token_balances) },
  { key: 'nft_metadata', label: 'NFT Metadata', render: (p: SolanaProvider) => bool(p.capabilities.nft_metadata) },
  { key: 'custom_indexing', label: 'Custom Indexing', render: (p: SolanaProvider) => bool(p.capabilities.custom_indexing) },
  { key: 'traces', label: 'Traces', render: (p: SolanaProvider) => bool(p.capabilities.traces) },
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
  return v
    ? <span className="text-accent font-bold">✓</span>
    : <span className="text-muted-foreground/40">✗</span>;
}

export function SolanaCapabilitiesMatrix({ providers }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] font-mono border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-2 px-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium sticky left-0 bg-muted/30 min-w-[130px]">
              Feature
            </th>
            {providers.map(p => (
              <th key={p.id} className="py-2 px-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium min-w-[88px]">
                <span className={p.is_us ? 'text-accent' : 'text-muted-foreground'}>
                  {p.name}
                </span>
                {p.is_mock && <span className="block text-[8px] text-muted-foreground/40 normal-case">sim</span>}
              </th>
            ))}
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
        </tbody>
      </table>
    </div>
  );
}
