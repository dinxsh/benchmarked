import { BaseAdapter } from './base';

export class SubsquidAdapter extends BaseAdapter {
  id = 'subsquid';
  name = 'Subsquid';

  constructor() {
    super();
    // Using a public squid for demo
    // Using public archive endpoint which returns block height
    this.endpoint =
      'https://v2.archive.subsquid.io/network/ethereum-mainnet/height';
  }

  protected async testCall(): Promise<number> {
    const startTime = performance.now();
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.text(); // Consume body (it's just a number)

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
      logo_url: '/providers/sqd.png',
      website_url: 'https://subsquid.io',
      supported_chains: [
        'ethereum',
        'polygon',
        'bsc',
        'avalanche',
        'arbitrum',
        'optimism',
        'base'
      ],
      pricing: {
        cost_per_million: 0, // Open source / Network cost
        rate_limit: 'Flexible'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: true,
        traces: true,
        db_access: true // Direct SQL access
      }
    };
  }

  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) return 0;
      const text = await response.text();
      return parseInt(text, 10);
    } catch (error) {
      return 0;
    }
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    try {
      // Use the height endpoint which returns a simple number
      const response = await fetch(this.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const data = { height: parseInt(text, 10) };
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
