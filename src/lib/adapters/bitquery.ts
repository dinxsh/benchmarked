import { BaseAdapter } from './base';

export class BitqueryAdapter extends BaseAdapter {
  id = 'bitquery';
  name = 'Bitquery';

  constructor() {
    super();
    this.endpoint =
      process.env.BITQUERY_ENDPOINT || 'https://graphql.bitquery.io';
  }

  protected async testCall(): Promise<number> {
    const startTime = performance.now();
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.BITQUERY_API_KEY || ''
        },
        body: JSON.stringify({
          query: '{ ethereum { blocks(limit: 1) { count } } }'
        }),
        signal: AbortSignal.timeout(5000)
      });

      // Bitquery might 401/403 without key, but we treat it as "alive" for latency if we get a response
      if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
      await response.json().catch(() => { }); // Consume body

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
      logo_url:
        'https://bitquery.io/wp-content/uploads/2020/09/bitquery_logo_w.png',
      website_url: 'https://bitquery.io',
      supported_chains: ['ethereum', 'bsc', 'polygon', 'solana', 'tron', 'eos'],
      pricing: {
        cost_per_million: 10, // Points system
        rate_limit: 'Points based'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: true, // It IS an indexer
        traces: true,
        db_access: false
      }
    };
  }
  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.BITQUERY_API_KEY || ''
        },
        body: JSON.stringify({
          query: '{ ethereum { blocks(limit: 1, options: {desc: "height"}) { height } } }'
        }),
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) return 0;
      const data = await response.json();
      // Bitquery: data.data.ethereum.blocks[0].height
      if (data?.data?.ethereum?.blocks?.[0]?.height) {
        return data.data.ethereum.blocks[0].height;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }
}
