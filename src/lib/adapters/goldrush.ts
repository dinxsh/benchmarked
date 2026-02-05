import { BaseAdapter } from './base';

export class GoldRushAdapter extends BaseAdapter {
  id = 'goldrush';
  name = 'GoldRush';

  constructor() {
    super();
    // GoldRush (formerly Covalent) uses the same API structure
    this.endpoint =
      process.env.GOLDRUSH_ENDPOINT ||
      'https://api.covalenthq.com/v1/1/block_v2/latest/?key=demo';
  }

  protected async testCall(): Promise<number> {
    const startTime = performance.now();
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: {
          // 'Authorization': \`Bearer \${process.env.GOLDRUSH_API_KEY}\` // If using structured key
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.json();

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
      logo_url: '/providers/goldrush.png',
      website_url: 'https://goldrush.dev',
      supported_chains: [
        'ethereum',
        'polygon',
        'avalanche',
        'bsc',
        'fantom',
        'arbitrum',
        'optimism',
        'base',
        'solana'
      ],
      pricing: {
        cost_per_million: 0.5, // Approx
        rate_limit: '50 req/sec' // Free tier
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: true,
        nft_metadata: true,
        historical_depth: 'full',
        custom_indexing: true,
        traces: false,
        db_access: false
      }
    };
  }
  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: {
          // 'Authorization': \`Bearer \${process.env.GOLDRUSH_API_KEY}\`
        },
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) return 0;
      const data = await response.json();
      // Covalent response structure: data.data.items[0].height
      if (data?.data?.items?.[0]?.height) {
        return data.data.items[0].height;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
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

  async getTokenPrice(params: import('../benchmark-types').TokenPriceParams): Promise<import('../benchmark-types').TokenPriceResult> {
    const startTime = performance.now();
    try {
      const apiKey = process.env.GOLDRUSH_API_KEY;

      // Check if API key is configured
      if (!apiKey) {
        throw new Error('GOLDRUSH_API_KEY not configured in environment variables');
      }

      const chain = params.network; // Use network as-is (e.g., 'eth-mainnet')
      const quoteCurrency = 'USD';

      // Correct endpoint structure: /v1/pricing/historical_by_addresses_v2/{chainName}/{quoteCurrency}/{contractAddress}/
      // Append key as query param for maximum compatibility
      const url = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chain}/${quoteCurrency}/${params.tokenAddress}/?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GoldRush API Error (${response.status}):`, errorText);
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Invalid or expired API key. Please check GOLDRUSH_API_KEY in .env.local');
        }
        if (response.status === 403) {
          throw new Error('API key does not have access to pricing endpoint');
        }
        if (response.status === 404) {
          throw new Error('Token not found or unsupported on this network');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Math.round(performance.now() - startTime);

      // Check for API error in response
      if (data.error) {
        throw new Error(data.error_message || 'API returned an error');
      }

      // Extract price from Covalent response
      const priceData = data?.data?.[0];
      if (!priceData || !priceData.prices || priceData.prices.length === 0) {
        throw new Error('No price data in response');
      }

      // Get the most recent price (first in array)
      const latestPrice = priceData.prices[0];
      const price = parseFloat(latestPrice.price);

      if (!price || isNaN(price)) {
        throw new Error('Invalid price value');
      }

      return {
        price,
        priceUSD: price.toFixed(2),
        timestamp: latestPrice.date || new Date().toISOString(),
        latency,
        additionalData: params.mode === 'full' ? {
          symbol: priceData.contract_metadata?.contract_ticker_symbol,
          name: priceData.contract_metadata?.contract_name
        } : undefined
      };
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);
      throw error;
    }
  }
}
