import { BaseAdapter } from './base';

const MOCK = {
  latency_p50: 85,
  latency_p95: 165,
  latency_p99: 240,
  uptime_percent: 99.8,
  throughput_rps: 180,
  slot_height: 280000000
};

export class SolanaHeliusAdapter extends BaseAdapter {
  id = 'solana-helius';
  name = 'Helius';

  constructor() {
    super();
    const key = process.env.HELIUS_API_KEY || '';
    this.endpoint = key
      ? `https://mainnet.helius-rpc.com/?api-key=${key}`
      : '';
    this.sampleSize = 3;
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://www.helius.dev/favicon.ico',
      website_url: 'https://helius.dev',
      provider_type: 'json-rpc' as const,
      supported_chains: ['solana'],
      pricing: {
        cost_per_million: 0,
        rate_limit: '10 req/s (free)'
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
      const jitter = Math.round((Math.random() - 0.5) * 30);
      return MOCK.latency_p50 + jitter;
    }
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
    if (!this.endpoint) {
      return { body: { mock: true, provider: this.id }, size: 40 };
    }
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
    if (!this.endpoint) return MOCK.slot_height;
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
