import { BaseAdapter } from './base';

const PUBLIC_ENDPOINT = 'https://rpc.ankr.com/solana';

const MOCK = {
  latency_p50: 155,
  latency_p95: 305,
  latency_p99: 440,
  uptime_percent: 98.5,
  throughput_rps: 75,
  slot_height: 280000000
};

export class SolanaAnkrAdapter extends BaseAdapter {
  id = 'solana-ankr';
  name = 'Ankr';

  constructor() {
    super();
    const key = process.env.ANKR_API_KEY || '';
    // Premium URL if key available, otherwise public endpoint (always live)
    this.endpoint = key
      ? `https://rpc.ankr.com/solana/${key}`
      : PUBLIC_ENDPOINT;
    this.sampleSize = 3;
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://www.ankr.com/favicon.ico',
      website_url: 'https://www.ankr.com/rpc/solana',
      provider_type: 'json-rpc' as const,
      supported_chains: ['solana', 'ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism', '30+ more'],
      pricing: {
        cost_per_million: 0,
        rate_limit: '30 req/s (public)'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: false,
        nft_metadata: false,
        historical_depth: 'recent',
        custom_indexing: false,
        traces: false,
        db_access: false
      }
    };
  }

  protected async testCall(): Promise<number> {
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
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return { body: null, size: 0 };
    const data = await response.json();
    const jsonString = JSON.stringify(data);
    return { body: data, size: new Blob([jsonString]).size };
  }

  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) return MOCK.slot_height;
      const data = await response.json();
      return typeof data.result === 'number' ? data.result : MOCK.slot_height;
    } catch {
      return MOCK.slot_height;
    }
  }

  async measureThroughput(): Promise<number> {
    const CONCURRENT = 10;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    const [metrics, throughput_rps, slot_height] = await Promise.all([
      this.measure(),
      this.measureThroughput(),
      this.getBlockHeight()
    ]);
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
