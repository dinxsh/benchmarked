import { BaseAdapter } from './base';

// Well-known active Solana wallet used as the benchmark target.
// GoldRush balances_v2 is the correct REST endpoint — block_v2 is NOT supported on Solana (returns 501).
const BENCHMARK_WALLET = 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ';

export class SolanaGoldRushAdapter extends BaseAdapter {
  id = 'solana-goldrush';
  name = 'GoldRush';
  isUs = true;

  constructor() {
    super();
    this.sampleSize = 5;
  }

  // GOLDRUSH_API_KEY is the canonical Next.js server env var.
  // VITE_GOLDRUSH_API_KEY is kept as a fallback for parity with local .env.local naming.
  private get apiKey() {
    return process.env.GOLDRUSH_API_KEY || process.env.VITE_GOLDRUSH_API_KEY || '';
  }

  private get grEndpoint() {
    return `https://api.covalenthq.com/v1/solana-mainnet/address/${BENCHMARK_WALLET}/balances_v2/`;
  }

  // Auth headers: use Authorization header (GoldRush SDK style) so the key never appears in server logs.
  private get authHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: '/providers/goldrush.png',
      website_url: 'https://goldrush.dev',
      provider_type: 'rest-api' as const,
      supported_chains: ['solana', 'ethereum', 'polygon', 'avalanche', 'bsc', 'arbitrum', 'optimism', 'base', '50+ more'],
      pricing: {
        cost_per_million: 0.5,
        rate_limit: '50 req/sec'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: true,
        traces: false,
        db_access: false
      }
    };
  }

  protected async testCall(): Promise<number> {
    if (!this.apiKey) throw new Error('GoldRush: GOLDRUSH_API_KEY not set');
    const startTime = performance.now();
    const response = await fetch(this.grEndpoint, {
      method: 'GET',
      headers: this.authHeaders,
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`GoldRush HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    if (!this.apiKey) throw new Error('GoldRush: GOLDRUSH_API_KEY not set');
    const response = await fetch(this.grEndpoint, {
      method: 'GET',
      headers: this.authHeaders,
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`GoldRush HTTP ${response.status}`);
    const data = await response.json();
    return { body: data, size: new Blob([JSON.stringify(data)]).size };
  }

  // Solana's chain_tip_height comes back null from GoldRush — return 0 rather than faking.
  async getBlockHeight(): Promise<number> {
    return 0;
  }

  async measureThroughput(): Promise<number> {
    if (!this.apiKey) throw new Error('GoldRush: GOLDRUSH_API_KEY not set');
    const CONCURRENT = 8;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    if (!this.apiKey) throw new Error('GoldRush: GOLDRUSH_API_KEY not set');
    const [metrics, throughput_rps] = await Promise.all([
      this.measure(),
      this.measureThroughput()
    ]);
    if (metrics.error_rate === 100) {
      throw new Error('GoldRush: all benchmark requests failed — check key and Solana access');
    }
    return { ...metrics, throughput_rps, slot_height: 0, is_mock: false };
  }
}
