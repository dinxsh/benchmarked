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

  async getTokenPrice(params: import('../benchmark-types').TokenPriceParams): Promise<import('../benchmark-types').TokenPriceResult> {
    const startTime = performance.now();
    try {
      const apiKey = process.env.ALCHEMY_API_KEY;

      if (!apiKey) {
        throw new Error('ALCHEMY_API_KEY not configured in environment variables');
      }

      // Map network to Alchemy network name
      const networkMap: Record<string, string> = {
        'eth-mainnet': 'eth-mainnet',
        'ethereum': 'eth-mainnet',
        'polygon': 'polygon-mainnet',
        'matic': 'polygon-mainnet',
        'arbitrum': 'arb-mainnet',
        'optimism': 'opt-mainnet',
        'base': 'base-mainnet',
      };

      const network = networkMap[params.network] || 'eth-mainnet';

      // Alchemy Prices API endpoint
      // https://docs.alchemy.com/reference/alchemy-getTokenPrice
      const url = `https://${network}.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: [params.tokenAddress.toLowerCase()],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Alchemy API key');
        }
        if (response.status === 403) {
          throw new Error('API key does not have access to Prices API');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Math.round(performance.now() - startTime);

      // Alchemy returns: { data: [{ prices: [{ value: "123.45", currency: "usd" }] }] }
      const tokenData = data.data?.[0];
      const usdPrice = tokenData?.prices?.find((p: any) => p.currency === 'usd')?.value;

      if (!usdPrice) {
        throw new Error('No USD price data in response');
      }

      const price = parseFloat(usdPrice);

      if (isNaN(price)) {
        throw new Error('Invalid price value');
      }

      return {
        price,
        priceUSD: price.toFixed(2),
        timestamp: new Date().toISOString(),
        latency,
        additionalData: params.mode === 'full' ? {
          symbol: tokenData?.symbol,
          name: tokenData?.name
        } : undefined
      };
    } catch (error) {
      throw error;
    }
  }
}
