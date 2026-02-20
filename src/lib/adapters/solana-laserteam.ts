import { BaseAdapter } from './base';

// LaserStream — high-performance Solana RPC infrastructure
// Private endpoint via LASERSTREAM_ENDPOINT or LASERSTREAM_API_KEY.
// Falls back to the public Solana mainnet cluster (api.mainnet-beta.solana.com)
// only when no private key is configured — this is real network data, not mock.
const PUBLIC_SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

export class SolanaLaserStreamAdapter extends BaseAdapter {
  id = 'solana-laserteam';        // keep stable id so existing bookmark/sort state works
  name = 'LaserStream';

  constructor() {
    super();
    if (process.env.LASERSTREAM_ENDPOINT) {
      this.endpoint = process.env.LASERSTREAM_ENDPOINT;
    } else if (process.env.LASERSTREAM_API_KEY) {
      this.endpoint = `https://mainnet.laserstream.io/${process.env.LASERSTREAM_API_KEY}`;
    } else {
      // Public Solana mainnet cluster — real data, no key required
      this.endpoint = PUBLIC_SOLANA_RPC;
    }
    this.sampleSize = 5;
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: '/providers/laserstream.png',
      website_url: 'https://laserstream.io',
      provider_type: 'json-rpc' as const,
      supported_chains: ['solana'],
      pricing: {
        cost_per_million: 0,
        rate_limit: '100 req/10s (public)'
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
      signal: AbortSignal.timeout(8000)
    });
    if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
    await response.text();
    return Math.round(performance.now() - startTime);
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { body: data, size: new Blob([JSON.stringify(data)]).size };
  }

  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return typeof data.result === 'number' ? data.result : 0;
    } catch {
      return 0;
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
    if (metrics.error_rate === 100) throw new Error('LaserStream: all requests failed');
    return { ...metrics, throughput_rps, slot_height, is_mock: false };
  }
}

// Re-export alias so any leftover imports don't break
export { SolanaLaserStreamAdapter as SolanaLaserTeamAdapter };
