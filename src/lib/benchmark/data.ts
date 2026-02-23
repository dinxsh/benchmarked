// GoldRush RPC Benchmark — data types and seed providers

export type ProviderType = 'json-rpc' | 'rest-api' | 'data-api';

export interface GRCapabilities {
  transactions: boolean;
  eventLogs: boolean;
  tokenBalances: boolean;
  nftMetadata: boolean;
  customIndexing: boolean;
  traces: boolean;
  historyDepth: string;
  costPerM: string;
  rateLimit: string;
  capScore: number;
}

export interface GRProvider {
  id: string;
  name: string;
  type: ProviderType;
  website: string;
  // Latency
  p50: number;
  p95: number;
  p99: number;
  jitter: number; // p99 - p50
  // Reliability
  uptime: number;  // 0-100
  errRate: number; // 0-100
  // Throughput
  rps: number;
  slot: number | null;
  // Pricing
  costPerM: number; // USD; 0 = free
  free: boolean;
  // Score
  score: number;
  // Rank
  rank: number;
  measuredAt?: string | null;  // ISO timestamp of last real measurement
  // Capabilities
  capabilities: GRCapabilities;
}

export const CAPABILITIES: Record<string, GRCapabilities> = {
  GoldRush: { transactions: true,  eventLogs: true,  tokenBalances: true,  nftMetadata: true,  customIndexing: true,  traces: false, historyDepth: 'full', costPerM: '$0.5', rateLimit: '50 req/s',   capScore: 83 },
  Birdeye:  { transactions: true,  eventLogs: false, tokenBalances: true,  nftMetadata: false, customIndexing: false, traces: false, historyDepth: '90d',  costPerM: '$2.0', rateLimit: '100 req/s',  capScore: 33 },
  Mobula:   { transactions: false, eventLogs: false, tokenBalances: true,  nftMetadata: false, customIndexing: false, traces: false, historyDepth: '30d',  costPerM: '$1.0', rateLimit: '60 req/s',   capScore: 17 },
};

/** Colour palette — Grafana dark theme accurate values */
export const GR_COLORS = {
  gold:         '#f2cc0c',   // Grafana yellow accent
  goldDim:      '#c09b09',
  bgBase:       '#111217',   // Grafana canvas
  bgCard:       '#181b1f',   // Grafana panel bg
  bgCardHover:  '#1e2128',
  border:       '#2d3035',   // Grafana border.medium
  borderBright: '#3f4147',   // Grafana border.strong
  textPrimary:  '#d9d9d9',   // Grafana text.primary
  textSecondary:'#9fa7b3',   // Grafana text.secondary
  textMuted:    '#6e6e6e',   // Grafana text.disabled
  green:        '#73bf69',   // Grafana success
  amber:        '#f5a623',   // Grafana warning
  red:          '#f2495c',   // Grafana error
  blue:         '#5794f2',   // Grafana info
  purple:       '#b877d9',   // Grafana purple
};

/** Font stacks — Inter UI + Roboto Mono data (Grafana standard) */
export const GR_FONTS = {
  ui:   'var(--font-sans)',
  mono: 'var(--font-roboto-mono)',
};

export const TYPE_LABELS: Record<ProviderType, string> = {
  'json-rpc': 'RPC',
  'rest-api': 'REST',
  'data-api': 'DATA',
};

export const TYPE_COLORS: Record<ProviderType, { bg: string; text: string; border: string }> = {
  'json-rpc': { bg: 'rgba(87,148,242,0.12)',  text: '#5794f2', border: 'rgba(87,148,242,0.3)'  },
  'rest-api': { bg: 'rgba(242,204,12,0.12)',  text: '#f2cc0c', border: 'rgba(242,204,12,0.3)'  },
  'data-api': { bg: 'rgba(255,153,0,0.12)',   text: '#ff9900', border: 'rgba(255,153,0,0.3)'   },
};
