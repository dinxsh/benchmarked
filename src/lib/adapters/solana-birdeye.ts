import { BaseAdapter } from './base';

const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const BIRDEYE_ENDPOINT = `https://public-api.birdeye.so/defi/price?address=${SOL_ADDRESS}`;

export class SolanaBirdeyeAdapter extends BaseAdapter {
  id = 'solana-birdeye';
  name = 'Birdeye';

  constructor() {
    super();
    this.endpoint = BIRDEYE_ENDPOINT;
    this.sampleSize = 5;
  }

  private get apiKey() {
    return process.env.BIRDEYE_API_KEY || '';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://birdeye.so/favicon.ico',
      website_url: 'https://birdeye.so',
      provider_type: 'data-api' as const,
      supported_chains: ['solana'],
      pricing: {
        cost_per_million: 2.0,
        rate_limit: '100 req/sec'
      },
      capabilities: {
        transactions: true,
        logs: false,
        token_balances: true,
        nft_metadata: false,
        historical_depth: '90d',
        custom_indexing: false,
        traces: false,
        db_access: false
      }
    };
  }

  protected async testCall(): Promise<number> {
    const startTime = performance.now();
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['X-API-KEY'] = this.apiKey;
    const response = await fetch(this.endpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000)
    });
    if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['X-API-KEY'] = this.apiKey;
    const response = await fetch(this.endpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { body: data, size: new Blob([JSON.stringify(data)]).size };
  }

  async getBlockHeight(): Promise<number> {
    return 0;
  }

  async measureThroughput(): Promise<number> {
    const CONCURRENT = 10;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    const [metrics, throughput_rps] = await Promise.all([
      this.measure(),
      this.measureThroughput()
    ]);
    if (metrics.error_rate === 100) throw new Error('Birdeye: all requests failed');
    return { ...metrics, throughput_rps, slot_height: 0, is_mock: false };
  }
}
