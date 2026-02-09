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

// ============================================================================
// STREAMING API BENCHMARK TYPES
// ============================================================================

export interface StreamingMetrics {
  connection_latency: number;        // Time to establish WebSocket connection (ms)
  first_data_latency: number;        // Time to receive first streaming data (ms)
  message_latency_p50?: number;      // 50th percentile message latency (median)
  message_latency_p95?: number;      // 95th percentile message latency
  message_latency_p99?: number;      // 99th percentile message latency
  throughput: number;                // Messages per second
  message_count: number;             // Total messages received during test
  connection_drops: number;          // Number of disconnections
  reconnection_count: number;        // Number of successful reconnections
  data_completeness: number;         // Percentage of expected data received (0-100)
  uptime_percent: number;            // Connection stability percentage
  average_message_size: number;      // Average message size in bytes
  error_rate: number;                // Percentage of error messages
  recovery_time_ms?: number;         // Average recovery time after disconnection (ms)
}

export interface StreamingBenchmarkParams {
  network: string;                   // e.g., 'ethereum', 'polygon'
  streamType: StreamingDataType;     // Type of data to stream
  duration?: number;                 // Test duration in milliseconds (default: 30000)
  expectedMessageRate?: number;      // Expected messages per second (for completeness calc)
}

export enum StreamingDataType {
  NEW_BLOCKS = 'newBlocks',
  NEW_TRANSACTIONS = 'newTransactions', 
  TOKEN_TRANSFERS = 'tokenTransfers',
  PRICE_FEEDS = 'priceFeeds',
  DEX_TRADES = 'dexTrades',
  PENDING_TRANSACTIONS = 'pendingTransactions'
}

export interface StreamingBenchmarkResult {
  provider: {
    id: string;
    name: string;
    type: 'WebSocket' | 'SSE' | 'GraphQL Subscription';
    logo: string;
    color: string;
    hasStreaming: boolean;
    endpoint: string;
    protocol: string;
    description: string;
  };
  status: 'success' | 'error' | 'unavailable' | 'timeout';
  metrics: StreamingMetrics;
  testDuration: number;              // Actual test duration in ms
  error?: string;
  sampleMessages?: any[];            // Sample messages received during test
}

export interface IStreamingAdapter {
  id: string;
  name: string;
  protocol: 'WebSocket' | 'SSE' | 'GraphQL Subscription';
  getMetadata(): {
    id: string;
    name: string;
    logo_url: string;
    website_url: string;
    supported_chains: string[];
    streaming_capabilities: StreamingDataType[];
    pricing: {
      cost_per_million_messages?: number;
      rate_limit: string;
    };
  };
  benchmarkStream(params: StreamingBenchmarkParams): Promise<StreamingBenchmarkResult>;
}

export interface StreamingProviderInfo {
  id: string;
  name: string;
  type: 'WebSocket' | 'SSE' | 'GraphQL Subscription';
  logo: string;
  color: string;
  hasStreaming: boolean;
  endpoint: string;
  protocol: string;
  description: string;
  adapter: IStreamingAdapter;
}
