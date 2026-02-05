export interface ProviderMetrics {
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
  uptime_percent: number;
  error_rate: number;
  response_size_bytes?: number;
}

export interface ProviderScores {
  final_score: number;
  latency_score: number;
  reliability_score: number;
  coverage_score: number;
  dx_score: number;
  pricing_score: number;
  response_size_score?: number;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  website_url: string;
  supported_chains: string[];
  pricing: {
    free_limit?: number;
    cost_per_million: number;
    rate_limit?: string;
  };
  capabilities: {
    transactions: boolean;
    logs: boolean;
    token_balances: boolean;
    nft_metadata: boolean;
    historical_depth: string;
    custom_indexing: boolean;
    traces?: boolean;
    db_access?: boolean;
  };
  current_metrics: ProviderMetrics;
  last_response_body?: any; // JSON or string of last valid response
  scores: ProviderScores;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  health_status: 'healthy' | 'degraded' | 'unstable';
  metrics_history?: { timestamp: string | Date; value: number }[];
}

export interface IProviderAdapter {
  id: string;
  name: string;
  measure(): Promise<ProviderMetrics>;
  getMetadata(): Omit<
    Provider,
    'current_metrics' | 'scores' | 'rank' | 'trend' | 'health_status'
  >;
  getBlockHeight(): Promise<number>;
  getTokenPrice?(params: TokenPriceParams): Promise<TokenPriceResult>;
}

export interface TokenPriceParams {
  tokenAddress: string;
  tokenSymbol?: string;
  network: string;
  mode?: TokenPriceBenchmarkMode;
}

export interface TokenPriceResult {
  price: number;
  priceUSD: string;
  timestamp: string;
  latency: number;
  additionalData?: {
    marketCap?: string;
    volume24h?: string;
    priceChange24h?: string;
    symbol?: string;
    name?: string;
  };
}

export enum TokenPriceBenchmarkMode {
  PRICE_ONLY = 'price',
  FULL_DATA = 'full',
  HISTORICAL = 'historical'
}

export interface TokenPriceBenchmarkResult {
  provider: {
    id: string;
    name: string;
    type: string;
    logo: string;
    color: string;
    hasTokenPrice: boolean;
    endpoint: string;
    method: string;
    description: string;
  };
  status: 'success' | 'error' | 'unavailable';
  latency: number;
  price: number | null;
  priceUSD?: string;
  timestamp?: string;
  error?: string;
  additionalData?: any;
}
