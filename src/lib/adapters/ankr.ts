import { BaseAdapter } from './base';

export class AnkrAdapter extends BaseAdapter {
  id = 'ankr';
  name = 'Ankr';
  // Trigger HMR update

  constructor() {
    super();
    this.endpoint = process.env.ANKR_ENDPOINT || 'https://rpc.ankr.com/eth';
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      slug: this.id,
      logo_url: '/providers/ankr.png',
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

  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        // console.error(\`Ankr Error: \${response.status}\`);
        return 0;
      }
      const data = await response.json();
      if (data.result) {
        return parseInt(data.result, 16);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }
}
