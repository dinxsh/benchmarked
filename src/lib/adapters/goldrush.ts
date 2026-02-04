import { BaseAdapter } from './base';

export class GoldRushAdapter extends BaseAdapter {
  id = 'goldrush';
  name = 'GoldRush';

  constructor() {
    super();
    // GoldRush (formerly Covalent) uses the same API structure
    this.endpoint =
      process.env.GOLDRUSH_ENDPOINT ||
      'https://api.covalenthq.com/v1/1/block_v2/latest/?key=demo';
  }

  protected async testCall(): Promise<number> {
    const startTime = performance.now();
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: {
          // 'Authorization': \`Bearer \${process.env.GOLDRUSH_API_KEY}\` // If using structured key
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.json();

      return Math.round(performance.now() - startTime);
    } catch (error) {
      throw error;
    }
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: '/providers/goldrush.png',
      website_url: 'https://goldrush.dev',
      supported_chains: [
        'ethereum',
        'polygon',
        'avalanche',
        'bsc',
        'fantom',
        'arbitrum',
        'optimism',
        'base',
        'solana'
      ],
      pricing: {
        cost_per_million: 0.5, // Approx
        rate_limit: '50 req/sec' // Free tier
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
  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: {
          // 'Authorization': \`Bearer \${process.env.GOLDRUSH_API_KEY}\`
        },
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) return 0;
      const data = await response.json();
      // Covalent response structure: data.data.items[0].height
      if (data?.data?.items?.[0]?.height) {
        return data.data.items[0].height;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const jsonString = JSON.stringify(data);
      const sizeInBytes = new Blob([jsonString]).size;

      return {
        body: data,
        size: sizeInBytes
      };
    } catch (error) {
      console.warn(`Failed to capture response for ${this.id}:`, error);
      throw error;
    }
  }
}
