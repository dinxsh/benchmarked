import { BaseAdapter } from './base';

export class ChainstackAdapter extends BaseAdapter {
  id = 'chainstack';
  name = 'Chainstack';

  constructor() {
    super();
    this.endpoint =
      process.env.CHAINSTACK_ENDPOINT ||
      'https://ethereum-mainnet.core.chainstack.com/demo';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: 'https://chainstack.com/favicon.ico',
      website_url: 'https://chainstack.com',
      supported_chains: [
        'ethereum',
        'polygon',
        'bsc',
        'avalanche',
        'solana',
        'near',
        'aurora'
      ],
      pricing: {
        cost_per_million: 1.2,
        rate_limit: 'Request based'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true, // With debug APIs
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: false
      }
    };
  }
}
