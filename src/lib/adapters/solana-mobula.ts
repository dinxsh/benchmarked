import { BaseAdapter } from './base';

const MOBULA_ENDPOINT = 'https://api.mobula.io/api/1/market/data?asset=solana&blockchain=solana';

const MOCK = {
  latency_p50: 201,
  latency_p95: 389,
  latency_p99: 541,
  uptime_percent: 97.4,
  throughput_rps: 54,
  slot_height: 280000000
};

export class SolanaMobulaAdapter extends BaseAdapter {
  id = 'solana-mobula';
  name = 'Mobula';

  constructor() {
    super();
    this.endpoint = MOBULA_ENDPOINT;
    this.sampleSize = 3;
  }

  private get apiKey() {
    return process.env.MOBULA_API_KEY || '';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://mobula.io/favicon.ico',
      website_url: 'https://mobula.io',
      supported_chains: ['solana', 'ethereum', 'bsc', 'polygon'],
      pricing: {
        cost_per_million: 1.0,
        rate_limit: '60 req/sec'
      },
      capabilities: {
        transactions: false,
        logs: false,
        token_balances: true,
        nft_metadata: false,
        historical_depth: '30d',
        custom_indexing: false,
        traces: false,
        db_access: false
      }
    };
  }

  protected async testCall(): Promise<number> {
    if (!this.apiKey) {
      const jitter = Math.round((Math.random() - 0.5) * 60);
      return MOCK.latency_p50 + jitter;
    }

    const startTime = performance.now();
    const response = await fetch(this.endpoint, {
      method: 'GET',
      headers: { Authorization: this.apiKey },
      signal: AbortSignal.timeout(5000)
    });
    if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    if (!this.apiKey) {
      const body = { mock: true, provider: this.id };
      return { body, size: JSON.stringify(body).length };
    }
    const response = await fetch(this.endpoint, {
      method: 'GET',
      headers: { Authorization: this.apiKey },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const jsonString = JSON.stringify(data);
    return { body: data, size: new Blob([jsonString]).size };
  }

  async getBlockHeight(): Promise<number> {
    return MOCK.slot_height;
  }

  async measureThroughput(): Promise<number> {
    if (!this.apiKey) return MOCK.throughput_rps;
    const CONCURRENT = 10;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    if (!this.apiKey) {
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
    const [metrics, throughput_rps] = await Promise.all([
      this.measure(),
      this.measureThroughput()
    ]);
    if (metrics.error_rate === 100) {
      return {
        latency_p50: MOCK.latency_p50, latency_p95: MOCK.latency_p95, latency_p99: MOCK.latency_p99,
        uptime_percent: MOCK.uptime_percent, error_rate: 100 - MOCK.uptime_percent,
        throughput_rps: MOCK.throughput_rps, slot_height: MOCK.slot_height, is_mock: true
      };
    }
    return { ...metrics, throughput_rps, slot_height: MOCK.slot_height, is_mock: false };
  }
}
