import { BaseAdapter } from './base';

export class AnkrAdapter extends BaseAdapter {
  id = 'ankr';
  name = 'Ankr';

  constructor() {
    super();
    this.endpoint = process.env.ANKR_ENDPOINT || 'https://rpc.ankr.com/eth';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://www.ankr.com/favicon.ico',
      website_url: 'https://www.ankr.com',
      supported_chains: [
        'ethereum',
        'polygon',
        'bsc',
        'solana',
        'avalanche',
        'fantom',
        'arbitrum'
      ],
      pricing: {
        cost_per_million: 0.8,
        rate_limit: 'Unlimited (Premium)'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: false,
        nft_metadata: false,
        historical_depth: 'full',
        custom_indexing: false
      }
    };
  }
}
