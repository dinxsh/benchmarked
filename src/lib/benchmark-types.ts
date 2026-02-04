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
}
