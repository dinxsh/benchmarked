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
  isMock: boolean;
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
  // Capabilities
  capabilities: GRCapabilities;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PROVIDERS_RAW = [
  { name: 'Alchemy',     type: 'json-rpc' as ProviderType, p50: 7,   p95: 202, p99: 202, uptime: 100, err: 0, rps: 48, slot: null,       cost: 1.5,  free: false, website: 'https://alchemy.com' },
  { name: 'QuickNode',   type: 'json-rpc' as ProviderType, p50: 8,   p95: 352, p99: 352, uptime: 100, err: 0, rps: 26, slot: 401.8e6,    cost: 0,    free: true,  website: 'https://quicknode.com' },
  { name: 'Ankr',        type: 'json-rpc' as ProviderType, p50: 9,   p95: 397, p99: 397, uptime: 100, err: 0, rps: 25, slot: null,        cost: 0,    free: true,  website: 'https://ankr.com' },
  { name: 'LaserStream', type: 'json-rpc' as ProviderType, p50: 10,  p95: 402, p99: 402, uptime: 100, err: 0, rps: 25, slot: 401.8e6,    cost: 0,    free: true,  website: 'https://laserstream.io' },
  { name: 'Helius',      type: 'json-rpc' as ProviderType, p50: 34,  p95: 419, p99: 419, uptime: 100, err: 0, rps: 24, slot: 401.8e6,    cost: 0,    free: true,  website: 'https://helius.dev' },
  { name: 'GoldRush',    type: 'rest-api' as ProviderType, p50: 11,  p95: 429, p99: 429, uptime: 100, err: 0, rps: 19, slot: null,        cost: 0.5,  free: false, website: 'https://goldrush.dev' },
  { name: 'Mobula',      type: 'data-api' as ProviderType, p50: 107, p95: 408, p99: 408, uptime: 100, err: 0, rps: 25, slot: null,        cost: 1.0,  free: false, website: 'https://mobula.io' },
  { name: 'Birdeye',     type: 'data-api' as ProviderType, p50: 498, p95: 585, p99: 585, uptime: 100, err: 0, rps: 16, slot: null,        cost: 2.0,  free: false, website: 'https://birdeye.so' },
] as const;

export const CAPABILITIES: Record<string, GRCapabilities> = {
  Alchemy:     { transactions: true,  eventLogs: true,  tokenBalances: true,  nftMetadata: true,  customIndexing: true,  traces: true,  historyDepth: 'full',   costPerM: '$1.5', rateLimit: '300 req/s',       capScore: 100 },
  QuickNode:   { transactions: true,  eventLogs: true,  tokenBalances: true,  nftMetadata: true,  customIndexing: true,  traces: true,  historyDepth: 'full',   costPerM: 'Free', rateLimit: '25 req/s (free)', capScore: 100 },
  Ankr:        { transactions: true,  eventLogs: true,  tokenBalances: false, nftMetadata: false, customIndexing: false, traces: false, historyDepth: 'recent', costPerM: 'Free', rateLimit: '30 req/s',        capScore: 33  },
  LaserStream: { transactions: true,  eventLogs: true,  tokenBalances: false, nftMetadata: false, customIndexing: false, traces: false, historyDepth: 'recent', costPerM: 'Free', rateLimit: '100 req/10s',     capScore: 33  },
  Helius:      { transactions: true,  eventLogs: true,  tokenBalances: true,  nftMetadata: true,  customIndexing: true,  traces: true,  historyDepth: 'full',   costPerM: 'Free', rateLimit: '10 req/s (free)', capScore: 100 },
  GoldRush:    { transactions: true,  eventLogs: true,  tokenBalances: true,  nftMetadata: true,  customIndexing: true,  traces: false, historyDepth: 'full',   costPerM: '$0.5', rateLimit: '50 req/s',        capScore: 83  },
  Mobula:      { transactions: false, eventLogs: false, tokenBalances: true,  nftMetadata: false, customIndexing: false, traces: false, historyDepth: '30d',    costPerM: '$1',   rateLimit: '60 req/s',        capScore: 17  },
  Birdeye:     { transactions: true,  eventLogs: false, tokenBalances: true,  nftMetadata: false, customIndexing: false, traces: false, historyDepth: '90d',    costPerM: '$2',   rateLimit: '100 req/s',       capScore: 33  },
};

/** Build GRProvider[] from raw seed, computing jitter + score + rank */
export function buildSeedProviders(): GRProvider[] {
  const raw = SEED_PROVIDERS_RAW.map((r) => ({
    id: r.name.toLowerCase().replace(/\s+/g, '-'),
    name: r.name,
    type: r.type,
    website: r.website,
    isMock: true,
    p50: r.p50,
    p95: r.p95,
    p99: r.p99,
    jitter: r.p99 - r.p50,
    uptime: r.uptime,
    errRate: r.err,
    rps: r.rps,
    slot: r.slot ?? null,
    costPerM: r.cost,
    free: r.free,
    score: 0,
    rank: 0,
    capabilities: CAPABILITIES[r.name] ?? CAPABILITIES['Ankr'],
  }));

  // Compute scores
  const maxRps = Math.max(...raw.map((p) => p.rps), 1);
  const maxLatency = 2000;
  const maxRpsNorm = 200;

  for (const p of raw) {
    const latencyScore    = Math.max(0, (1 - p.p50 / maxLatency)) * 100 * 0.40;
    const reliabilityScore = p.uptime * 0.35;
    const throughputScore = Math.min(100, (p.rps / maxRpsNorm) * 100) * 0.25;
    p.score = Math.round((latencyScore + reliabilityScore + throughputScore) * 10) / 10;
  }

  // Rank by score descending
  const sorted = [...raw].sort((a, b) => b.score - a.score);
  sorted.forEach((p, i) => { p.rank = i + 1; });

  return sorted;
}

/** Colour palette for the GoldRush brand */
export const GR_COLORS = {
  gold:       '#F5C518',
  goldDim:    '#C49A10',
  bgBase:     '#090C10',
  bgCard:     '#0E1219',
  bgCardHover:'#131A24',
  border:     '#1C2333',
  borderBright:'#2A3A50',
  textPrimary:'#F0F4F8',
  textSecondary:'#8899AA',
  textMuted:  '#4A5568',
  green:      '#00D4A0',
  amber:      '#F5A623',
  red:        '#FF4D4D',
  blue:       '#4D9EFF',
  purple:     '#8B5CF6',
};

export const TYPE_LABELS: Record<ProviderType, string> = {
  'json-rpc': 'RPC',
  'rest-api': 'REST',
  'data-api': 'DATA',
};

export const TYPE_COLORS: Record<ProviderType, { bg: string; text: string; border: string }> = {
  'json-rpc': { bg: 'rgba(77,158,255,0.12)',  text: '#4D9EFF', border: 'rgba(77,158,255,0.3)'  },
  'rest-api': { bg: 'rgba(245,197,24,0.12)',  text: '#F5C518', border: 'rgba(245,197,24,0.3)'  },
  'data-api': { bg: 'rgba(245,166,35,0.12)',  text: '#F5A623', border: 'rgba(245,166,35,0.3)'  },
};
