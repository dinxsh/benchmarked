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

  async getTokenPrice(params: import('../benchmark-types').TokenPriceParams): Promise<import('../benchmark-types').TokenPriceResult> {
    const startTime = performance.now();
    try {
      // QuickNode Odos Token Pricing Add-On
      // https://marketplace.quicknode.com/add-on/odos-token-pricing
      // Requires the Odos add-on to be enabled on your QuickNode endpoint

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'odos_tokenPrices',
          params: [{
            tokenAddrs: [params.tokenAddress.toLowerCase()]
          }],
          id: 1
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Math.round(performance.now() - startTime);

      // Check for JSON-RPC error
      if (data.error) {
        // Common error: Method not found (Odos add-on not enabled)
        if (data.error.code === -32601) {
          throw new Error('Odos Token Pricing add-on not enabled. Enable it in QuickNode marketplace.');
        }
        throw new Error(data.error.message || 'RPC error');
      }

      // Odos returns: { result: { "<address>": { price: 123.45 } } }
      const tokenAddress = params.tokenAddress.toLowerCase();
      const tokenPrice = data.result?.[tokenAddress]?.price;

      if (!tokenPrice) {
        throw new Error('No price data in response');
      }

      const price = parseFloat(tokenPrice);

      if (isNaN(price)) {
        throw new Error('Invalid price value');
      }

      return {
        price,
        priceUSD: price.toFixed(2),
        timestamp: new Date().toISOString(),
        latency,
      };
    } catch (error) {
      throw error;
    }
  }
}
