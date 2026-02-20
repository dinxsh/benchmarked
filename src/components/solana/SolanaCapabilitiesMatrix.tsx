'use client';

import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

const BOOL_KEYS: (keyof SolanaProvider['capabilities'])[] = [
  'transactions', 'logs', 'token_balances', 'nft_metadata', 'custom_indexing', 'traces',
];

const TYPE_BADGE: Record<string, string> = {
  'json-rpc': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  'rest-api': 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  'data-api': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
};
const TYPE_LABEL: Record<string, string> = {
  'json-rpc': 'RPC',
  'rest-api': 'REST',
  'data-api': 'Data',
};

const FEATURES: { key: string; label: string; render: (p: SolanaProvider) => React.ReactNode }[] = [
  {
    key: 'type', label: 'Provider Type',
    render: (p) => (
      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${TYPE_BADGE[p.provider_type]}`}>
        {TYPE_LABEL[p.provider_type]}
      </span>
    ),
  },
  { key: 'transactions',    label: 'Transactions',    render: (p) => bool(p.capabilities.transactions) },
  { key: 'logs',            label: 'Event Logs',       render: (p) => bool(p.capabilities.logs) },
  { key: 'token_balances',  label: 'Token Balances',   render: (p) => bool(p.capabilities.token_balances) },
  { key: 'nft_metadata',    label: 'NFT Metadata',     render: (p) => bool(p.capabilities.nft_metadata) },
  { key: 'custom_indexing', label: 'Custom Indexing',  render: (p) => bool(p.capabilities.custom_indexing) },
  { key: 'traces',          label: 'Traces',           render: (p) => bool(p.capabilities.traces) },
  {
    key: 'historical_depth', label: 'History Depth',
    render: (p) => (
      <span className="text-sm font-semibold text-foreground/75">{p.capabilities.historical_depth}</span>
    ),
  },
  {
    key: 'cost', label: 'Cost / M Req',
    render: (p) => (
      <span className={`text-sm font-bold font-mono tabular-nums ${p.pricing.cost_per_million === 0 ? 'text-emerald-500' : 'text-foreground/80'}`}>
        {p.pricing.cost_per_million === 0 ? 'Free' : `$${p.pricing.cost_per_million}`}
      </span>
    ),
  },
  {
    key: 'rate_limit', label: 'Rate Limit',
    render: (p) => (
      <span className="text-sm font-medium text-foreground/65">{p.pricing.rate_limit}</span>
    ),
  },
];

function bool(v: boolean) {
  return v ? (
    <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-500 font-bold text-sm">✓</span>
  ) : (
    <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground/25 text-sm">✗</span>
  );
}

export function SolanaCapabilitiesMatrix({ providers }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-border/50">
            <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/60 sticky left-0 bg-card min-w-[150px]">
              Feature
            </th>
            {providers.map(p => (
              <th key={p.id} className="py-3 px-3 text-center min-w-[110px]">
                <span className="block text-sm font-extrabold text-foreground">{p.name}</span>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${TYPE_BADGE[p.provider_type]}`}>
                  {TYPE_LABEL[p.provider_type]}
                </span>
                {p.is_mock && (
                  <span className="block text-[10px] text-muted-foreground/40 font-mono mt-0.5">sim</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/25">
          {FEATURES.map(({ key, label, render }) => (
            <tr key={key} className="hover:bg-muted/15 transition-colors">
              <td className="py-3 px-4 text-sm font-semibold text-muted-foreground/70 sticky left-0 bg-card whitespace-nowrap">
                {label}
              </td>
              {providers.map(p => (
                <td key={p.id} className="py-3 px-3 text-center">
                  {render(p)}
                </td>
              ))}
            </tr>
          ))}

          {/* Capability score row */}
          <tr className="border-t-2 border-border/50 bg-muted/[0.03]">
            <td className="py-3.5 px-4 text-sm font-bold text-foreground sticky left-0 bg-muted/[0.03] whitespace-nowrap">
              Cap. Score
            </td>
            {providers.map(p => {
              const count = BOOL_KEYS.filter(k => p.capabilities[k] as unknown as boolean).length;
              const pct   = Math.round((count / BOOL_KEYS.length) * 100);
              const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
              const textCls = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500';
              return (
                <td key={p.id} className="py-3.5 px-3 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-14 h-1.5 bg-border/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className={`text-sm font-bold font-mono tabular-nums ${textCls}`}>{pct}%</span>
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
