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
      logo_url: '/providers/bitquery.png',
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
      if (!process.env.BITQUERY_API_KEY) {
        // console.warn('Bitquery API Key missing');
        return 0;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.BITQUERY_API_KEY
        },
        // Using V1 Mainnet Query
        body: JSON.stringify({
          query: `
            query {
              ethereum {
                blocks(options: {desc: "height", limit: 1}) {
                  height
                }
              }
            }
          `
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) return 0;
      const data = await response.json();

      if (data?.data?.ethereum?.blocks?.[0]?.height) {
        return Number(data.data.ethereum.blocks[0].height);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  protected async captureResponse(): Promise<{ body: any; size: number }> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.BITQUERY_API_KEY || ''
        },
        body: JSON.stringify({
          query: `
            query {
              ethereum {
                blocks(options: {desc: "height", limit: 1}) {
                  height
                  timestamp {
                    time
                  }
                  transactionCount
                }
              }
            }
          `
        }),
        signal: AbortSignal.timeout(5000)
      });

      // Accept 401 as valid response for size calculation
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
      if (!process.env.BITQUERY_API_KEY) {
        throw new Error('Bitquery API Key required');
      }

      // Try V2 Streaming API first (better performance)
      const v2Endpoint = 'https://streaming.bitquery.io/graphql';
      const network = params.network === 'eth-mainnet' ? 'ethereum' : params.network.replace('-mainnet', '');


      const v2Query = `
        query {
          EVM(network: ${network}) {
            DEXTradeByTokens(
              where: {
                Trade: {
                  Currency: {
                    SmartContract: {is: "${params.tokenAddress}"}
                  }
                }
              }
              orderBy: {descending: Block_Time}
              limit: {count: 1}
            ) {
              Trade {
                Currency {
                  Symbol
                  Name
                }
                PriceInUSD
              }
              Block {
                Time
              }
            }
          }
        }
      `;

      let response = await fetch(v2Endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.BITQUERY_API_KEY,
          'Authorization': `Bearer ${process.env.BITQUERY_API_KEY}`
        },
        body: JSON.stringify({ query: v2Query }),
        signal: AbortSignal.timeout(5000)
      });

      let data = await response.json();
      let latency = Math.round(performance.now() - startTime);

      // If V2 fails, log it and fallback to V1
      if (data.errors || !data.data?.EVM) {
        console.warn('Bitquery V2 Failed:', JSON.stringify(data.errors || 'No EVM data'));

        const v1Query = `
          query {
            ethereum(network: ${network}) {
              dexTrades(
                options: {limit: 1, desc: "block.height"}
                baseCurrency: {is: "${params.tokenAddress}"}
              ) {
                baseCurrency {
                  symbol
                  name
                }
                quotePrice
                block {
                  height
                  timestamp {
                    time
                  }
                }
              }
            }
          }
        `;

        response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.BITQUERY_API_KEY
          },
          body: JSON.stringify({ query: v1Query }),
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        data = await response.json();
        latency = Math.round(performance.now() - startTime);

        const trade = data?.data?.ethereum?.dexTrades?.[0];
        if (!trade || !trade.quotePrice) {
          throw new Error('No price data in response');
        }

        const price = parseFloat(trade.quotePrice);

        return {
          price,
          priceUSD: price.toFixed(2),
          timestamp: trade.block?.timestamp?.time || new Date().toISOString(),
          latency,
          additionalData: params.mode === 'full' ? {
            symbol: trade.baseCurrency?.symbol,
            name: trade.baseCurrency?.name
          } : undefined
        };
      }

      // Parse V2 response
      const tradeData = data.data.EVM.DEXTradeByTokens?.[0];
      if (!tradeData || !tradeData.Trade?.PriceInUSD) {
        throw new Error('No price data in response');
      }

      const price = parseFloat(tradeData.Trade.PriceInUSD);

      return {
        price,
        priceUSD: price.toFixed(2),
        timestamp: tradeData.Block?.Time || new Date().toISOString(),
        latency,
        additionalData: params.mode === 'full' ? {
          symbol: tradeData.Trade.Currency?.Symbol,
          name: tradeData.Trade.Currency?.Name
        } : undefined
      };
    } catch (error) {
      throw error;
    }
  }
}
