import { BaseAdapter } from './base';

export class SolanaAlchemyAdapter extends BaseAdapter {
  id = 'solana-alchemy';
  name = 'Alchemy';

  constructor() {
    super();
    if (process.env.ALCHEMY_SOLANA_ENDPOINT) {
      this.endpoint = process.env.ALCHEMY_SOLANA_ENDPOINT;
    } else if (process.env.ALCHEMY_API_KEY) {
      this.endpoint = `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    } else {
      this.endpoint = '';
    }
    this.sampleSize = 3;
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://www.alchemy.com/favicon.ico',
      website_url: 'https://www.alchemy.com',
      provider_type: 'json-rpc' as const,
      supported_chains: ['solana', 'ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
      pricing: {
        cost_per_million: 1.5,
        rate_limit: '300 req/sec'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: true,
        traces: true,
        db_access: false
      }
    };
  }

  protected async testCall(): Promise<number> {
    if (!this.endpoint) throw new Error('Alchemy: no Solana endpoint configured');
    const startTime = performance.now();
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
      signal: AbortSignal.timeout(5000)
    });
    if (response.status === 401 || response.status >= 500) throw new Error(`HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    if (!this.endpoint) throw new Error('Alchemy: no Solana endpoint configured');
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { body: data, size: new Blob([JSON.stringify(data)]).size };
  }

  async getBlockHeight(): Promise<number> {
    if (!this.endpoint) return 0;
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return typeof data.result === 'number' ? data.result : 0;
    } catch {
      return 0;
    }
  }

  async measureThroughput(): Promise<number> {
    if (!this.endpoint) throw new Error('Alchemy: no Solana endpoint configured');
    const CONCURRENT = 10;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    if (!this.endpoint) throw new Error('Alchemy: no Solana endpoint configured');
    const [metrics, throughput_rps, slot_height] = await Promise.all([
      this.measure(),
      this.measureThroughput(),
      this.getBlockHeight()
    ]);
    if (metrics.error_rate === 100) throw new Error('Alchemy: all requests failed (wrong chain key?)');
    return { ...metrics, throughput_rps, slot_height, is_mock: false };
  }
}
