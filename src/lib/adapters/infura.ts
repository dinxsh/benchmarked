import { BaseAdapter } from './base';

export class InfuraAdapter extends BaseAdapter {
  id = 'infura';
  name = 'Infura';

  constructor() {
    super();
    this.endpoint =
      process.env.INFURA_ENDPOINT || 'https://mainnet.infura.io/v3/demo';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://infura.io/favicon.ico',
      website_url: 'https://infura.io',
      supported_chains: ['ethereum', 'polygon', 'arbitrum'],
      pricing: {
        cost_per_million: 1.0,
        rate_limit: '100 req/sec'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: false,
        historical_depth: 'full',
        custom_indexing: false
      }
    };
  }
}
