import { BaseAdapter } from './base';

// Helius Data API — token balance benchmark
// Same wallet used across all data-API providers for an apples-to-apples comparison.
const BENCHMARK_WALLET = 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ';

export class SolanaLaserStreamAdapter extends BaseAdapter {
  id = 'solana-laserteam'; // stable id — keeps existing sort/bookmark state
  name = 'Helius';

  constructor() {
    super();
    this.sampleSize = 5;
  }

  private get apiKey() {
    return process.env.HELIUS_API_KEY || '';
  }

  private get dataEndpoint() {
    return `https://api.helius.xyz/v0/addresses/${BENCHMARK_WALLET}/balances?api-key=${this.apiKey}`;
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://www.helius.dev/favicon.ico',
      website_url: 'https://helius.dev',
      provider_type: 'data-api' as const,
      supported_chains: ['solana'],
      pricing: {
        cost_per_million: 0,
        rate_limit: '10 req/s (free)',
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: true,
        traces: true,
        db_access: false,
      },
    };
  }

  protected async testCall(): Promise<number> {
    if (!this.apiKey) throw new Error('Helius: HELIUS_API_KEY not set');
    const startTime = performance.now();
    const response = await fetch(this.dataEndpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Helius HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    if (!this.apiKey) throw new Error('Helius: HELIUS_API_KEY not set');
    const response = await fetch(this.dataEndpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Helius HTTP ${response.status}`);
    const data = await response.json();
    return { body: data, size: new Blob([JSON.stringify(data)]).size };
  }

  async getBlockHeight(): Promise<number> {
    return 0; // data API — no slot height exposed
  }

  async measureThroughput(): Promise<number> {
    if (!this.apiKey) throw new Error('Helius: HELIUS_API_KEY not set');
    const CONCURRENT = 8;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    if (!this.apiKey) throw new Error('Helius: HELIUS_API_KEY not set');
    const [metrics, throughput_rps] = await Promise.all([
      this.measure(),
      this.measureThroughput(),
    ]);
    if (metrics.error_rate === 100) throw new Error('Helius: all benchmark requests failed — check API key');
    return { ...metrics, throughput_rps, slot_height: 0, is_mock: false };
  }
}

// Re-export alias so any leftover imports don't break
export { SolanaLaserStreamAdapter as SolanaLaserTeamAdapter };
