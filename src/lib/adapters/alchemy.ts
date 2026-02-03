import { BaseAdapter } from './base';

export class AlchemyAdapter extends BaseAdapter {
  id = 'alchemy';
  name = 'Alchemy';

  constructor() {
    super();
    this.endpoint =
      process.env.ALCHEMY_ENDPOINT ||
      'https://eth-mainnet.g.alchemy.com/v2/demo';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://www.alchemy.com/favicon.ico',
      website_url: 'https://www.alchemy.com',
      supported_chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
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
        custom_indexing: true
      }
    };
  }
}
