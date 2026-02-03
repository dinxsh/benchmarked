import { BaseAdapter } from './base';

export class QuickNodeAdapter extends BaseAdapter {
  id = 'quicknode';
  name = 'QuickNode';

  constructor() {
    super();
    this.endpoint =
      process.env.QUICKNODE_ENDPOINT || 'https://eth-mainnet.quiknode.pro/demo';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://www.quicknode.com/favicon.ico',
      website_url: 'https://www.quicknode.com',
      supported_chains: ['ethereum', 'polygon', 'solana', 'avalanche'],
      pricing: {
        cost_per_million: 2.0,
        rate_limit: '500 req/sec'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: true
      }
    };
  }
}
