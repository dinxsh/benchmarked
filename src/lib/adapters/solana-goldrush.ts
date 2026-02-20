import { BaseAdapter } from './base';

export class SolanaGoldRushAdapter extends BaseAdapter {
  id = 'solana-goldrush';
  name = 'GoldRush';
  isUs = true;

  constructor() {
    super();
    this.sampleSize = 3;
  }

  private get apiKey() {
    return process.env.VITE_GOLDRUSH_API_KEY || process.env.GOLDRUSH_API_KEY || '';
  }

  private get solanaEndpoint() {
    if (!this.apiKey) return '';
    return `https://api.covalenthq.com/v1/solana-mainnet/block_v2/latest/?key=${this.apiKey}`;
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
    if (!this.apiKey) throw new Error('GoldRush: no API key configured');
    const startTime = performance.now();
    const response = await fetch(this.solanaEndpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    if (!this.apiKey) throw new Error('GoldRush: no API key configured');
    const response = await fetch(this.solanaEndpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const jsonString = JSON.stringify(data);
    return { body: data, size: new Blob([jsonString]).size };
  }

  async getBlockHeight(): Promise<number> {
    if (!this.apiKey) return 0;
    try {
      const response = await fetch(this.solanaEndpoint, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) return 0;
      const data = await response.json();
      return data?.data?.items?.[0]?.height ?? 0;
    } catch {
      return 0;
    }
  }

  async measureThroughput(): Promise<number> {
    if (!this.apiKey) throw new Error('GoldRush: no API key configured');
    const CONCURRENT = 10;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    if (!this.apiKey) throw new Error('GoldRush: no API key configured');
    const [metrics, throughput_rps] = await Promise.all([
      this.measure(),
      this.measureThroughput()
    ]);
    if (metrics.error_rate === 100) throw new Error('GoldRush: all requests failed');
    return { ...metrics, throughput_rps, slot_height: await this.getBlockHeight(), is_mock: false };
  }
}
