import { BaseAdapter } from './base';

const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const SOLANA_NETWORK_ID = 1399811149;
const CODEX_ENDPOINT = 'https://graph.codex.io/graphql';

const PRICE_QUERY = JSON.stringify({
  query: `{
    getTokenPrices(inputs: [{ address: "${SOL_ADDRESS}", networkId: ${SOLANA_NETWORK_ID} }]) {
      priceUsd
    }
  }`,
});

export class SolanaCodexAdapter extends BaseAdapter {
  id = 'solana-codex';
  name = 'Codex';

  constructor() {
    super();
    this.endpoint = CODEX_ENDPOINT;
    this.sampleSize = 5;
  }

  private get apiKey() {
    return process.env.CODEX_API_KEY || '';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: '/providers/codex.png',
      website_url: 'https://codex.io',
      provider_type: 'data-api' as const,
      supported_chains: ['solana', 'ethereum', 'base', 'bsc', 'arbitrum', 'polygon', 'avalanche', '30+ more'],
      pricing: {
        cost_per_million: 2.0,
        rate_limit: '300 req/min',
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: false,
        nft_metadata: false,
        historical_depth: 'full',
        custom_indexing: false,
        traces: false,
        db_access: false,
      },
    };
  }

  protected async testCall(): Promise<number> {
    if (!this.apiKey) throw new Error('Codex: CODEX_API_KEY not set');
    const startTime = performance.now();
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
      },
      body: PRICE_QUERY,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status >= 500) throw new Error(`Codex HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    if (!this.apiKey) throw new Error('Codex: CODEX_API_KEY not set');
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
      },
      body: PRICE_QUERY,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Codex HTTP ${response.status}`);
    const data = await response.json();
    return { body: data, size: new Blob([JSON.stringify(data)]).size };
  }

  async getBlockHeight(): Promise<number> {
    return 0;
  }

  async measureThroughput(): Promise<number> {
    if (!this.apiKey) throw new Error('Codex: CODEX_API_KEY not set');
    const CONCURRENT = 8;
    const start = performance.now();
    await Promise.allSettled(Array.from({ length: CONCURRENT }, () => this.testCall()));
    const elapsed = (performance.now() - start) / 1000;
    return Math.round(CONCURRENT / elapsed);
  }

  async measureWithThroughput() {
    if (!this.apiKey) throw new Error('Codex: CODEX_API_KEY not set');
    const [metrics, throughput_rps] = await Promise.all([
      this.measure(),
      this.measureThroughput(),
    ]);
    if (metrics.error_rate === 100) {
      throw new Error('Codex: all benchmark requests failed — check CODEX_API_KEY');
    }
    return { ...metrics, throughput_rps, slot_height: 0, is_mock: false };
  }
}
