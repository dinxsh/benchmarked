import { BaseAdapter } from './base';

const MOCK = {
  latency_p50: 98,
  latency_p95: 201,
  latency_p99: 334,
  uptime_percent: 99.7,
  throughput_rps: 95,
  slot_height: 280000000
};

export class SolanaAlchemyAdapter extends BaseAdapter {
  id = 'solana-alchemy';
  name = 'Alchemy';

  constructor() {
    super();
    const apiKey = process.env.ALCHEMY_SOLANA_ENDPOINT
      ? ''  // use endpoint directly if set
      : process.env.ALCHEMY_API_KEY || '';

    if (process.env.ALCHEMY_SOLANA_ENDPOINT) {
      this.endpoint = process.env.ALCHEMY_SOLANA_ENDPOINT;
    } else if (apiKey) {
      this.endpoint = `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`;
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
    if (!this.endpoint) {
      const jitter = Math.round((Math.random() - 0.5) * 40);
      return MOCK.latency_p50 + jitter;
    }

    const startTime = performance.now();
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSlot',
        params: []
      }),
      signal: AbortSignal.timeout(5000)
    });
    // 401 = bad/wrong-chain key → count as error so mock fallback triggers
    if (response.status === 401 || response.status >= 500) throw new Error(`HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    if (!this.endpoint) {
      const body = { mock: true, provider: this.id };
      return { body, size: JSON.stringify(body).length };
    }
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
      signal: AbortSignal.timeout(5000)
    });
    if (response.status === 401 || response.status === 429 || response.status === 403) return { body: null, size: 0 };
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const jsonString = JSON.stringify(data);
    return { body: data, size: new Blob([jsonString]).size };
  }

  async getBlockHeight(): Promise<number> {
    if (!this.endpoint) return MOCK.slot_height;
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
    if (!this.endpoint) return MOCK.throughput_rps;
    const CONCURRENT = 10;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    if (!this.endpoint) {
      return {
        latency_p50: MOCK.latency_p50,
        latency_p95: MOCK.latency_p95,
        latency_p99: MOCK.latency_p99,
        uptime_percent: MOCK.uptime_percent,
        error_rate: 100 - MOCK.uptime_percent,
        throughput_rps: MOCK.throughput_rps,
        slot_height: MOCK.slot_height,
        is_mock: true
      };
    }
    const [metrics, throughput_rps, slot_height] = await Promise.all([
      this.measure(),
      this.measureThroughput(),
      this.getBlockHeight()
    ]);
    // 401 / wrong-chain key → all samples fail → fall back to mock
    if (metrics.error_rate === 100) {
      return {
        latency_p50: MOCK.latency_p50,
        latency_p95: MOCK.latency_p95,
        latency_p99: MOCK.latency_p99,
        uptime_percent: MOCK.uptime_percent,
        error_rate: 100 - MOCK.uptime_percent,
        throughput_rps: MOCK.throughput_rps,
        slot_height: MOCK.slot_height,
        is_mock: true
      };
    }
    return { ...metrics, throughput_rps, slot_height, is_mock: false };
  }
}
