/**
 * Token Price Fetcher for Multiple Infrastructure Providers
 * 
 * A unified interface for fetching USD token prices from various blockchain
 * infrastructure providers including Alchemy, QuickNode, Bitquery, Ankr, etc.
 * 
 * @module tokenPrices
 * @requires Node.js 20+
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TokenPriceRequest {
    chainId: number;
    contractAddress: string;
    symbol?: string;
}

export interface TokenPriceResult {
    source: string;
    priceUsd: number | null;
    raw: any;
    error?: string;
    timestamp?: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates token price request parameters
 */
function validateRequest(request: TokenPriceRequest): void {
    if (!request.contractAddress || request.contractAddress.trim() === '') {
        throw new Error('Contract address is required');
    }
    if (!request.chainId || request.chainId <= 0) {
        throw new Error('Valid chainId is required');
    }
}

/**
 * Maps chainId to network names for various providers
 */
function getNetworkName(chainId: number): { alchemy: string; bitquery: string; ankr: string } {
    const networks: Record<number, { alchemy: string; bitquery: string; ankr: string }> = {
        1: { alchemy: 'eth-mainnet', bitquery: 'ethereum', ankr: 'eth' },
        137: { alchemy: 'polygon-mainnet', bitquery: 'matic', ankr: 'polygon' },
        56: { alchemy: 'bnb-mainnet', bitquery: 'bsc', ankr: 'bsc' },
        42161: { alchemy: 'arb-mainnet', bitquery: 'arbitrum', ankr: 'arbitrum' },
        10: { alchemy: 'opt-mainnet', bitquery: 'optimism', ankr: 'optimism' },
        8453: { alchemy: 'base-mainnet', bitquery: 'base', ankr: 'base' },
        43114: { alchemy: 'avax-mainnet', bitquery: 'avalanche', ankr: 'avalanche' },
    };

    return networks[chainId] || { alchemy: 'eth-mainnet', bitquery: 'ethereum', ankr: 'eth' };
}

// ============================================================================
// 1. Alchemy - Prices API
// ============================================================================

/**
 * Fetches token price from Alchemy Prices API
 * 
 * @see https://docs.alchemy.com/reference/alchemy-getTokenPrice
 * @see https://docs.alchemy.com/docs/alchemy-prices-api
 * 
 * Uses Alchemy's native Prices API which provides real-time token prices
 * across multiple chains with high accuracy and low latency.
 */
export async function getAlchemyPrice(
    request: TokenPriceRequest
): Promise<TokenPriceResult> {
    const apiKey = process.env.ALCHEMY_API_KEY;

    if (!apiKey) {
        return {
            source: 'Alchemy',
            priceUsd: null,
            raw: null,
            error: 'ALCHEMY_API_KEY not configured'
        };
    }

    try {
        validateRequest(request);
        const network = getNetworkName(request.chainId).alchemy;

        // Alchemy Prices API endpoint
        const url = `https://${network}.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                addresses: [request.contractAddress.toLowerCase()],
            }),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                source: 'Alchemy',
                priceUsd: null,
                raw: { status: response.status, error: errorText },
                error: `HTTP ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json();

        // Alchemy returns data in format: { data: [{ prices: [{ value: "123.45", currency: "usd" }] }] }
        const tokenData = data.data?.[0];
        const usdPrice = tokenData?.prices?.find((p: any) => p.currency === 'usd')?.value;

        return {
            source: 'Alchemy',
            priceUsd: usdPrice ? parseFloat(usdPrice) : null,
            raw: data,
            timestamp: Date.now(),
        };
    } catch (error: any) {
        return {
            source: 'Alchemy',
            priceUsd: null,
            raw: null,
            error: error.message,
        };
    }
}

// ============================================================================
// 2. QuickNode - Odos Token Prices Add-On
// ============================================================================

/**
 * Fetches token price from QuickNode using Odos Token Pricing Add-On
 * 
 * @see https://marketplace.quicknode.com/add-on/odos-token-pricing
 * @see https://docs.odos.xyz/product/sor/supported-tokens
 * 
 * Uses QuickNode's Odos marketplace add-on which provides real-time
 * token pricing via JSON-RPC method `odos_tokenPrices`.
 */
export async function getQuickNodePrice(
    request: TokenPriceRequest
): Promise<TokenPriceResult> {
    const rpcUrl = process.env.QUICKNODE_RPC_URL;

    if (!rpcUrl) {
        return {
            source: 'QuickNode',
            priceUsd: null,
            raw: null,
            error: 'QUICKNODE_RPC_URL not configured'
        };
    }

    try {
        validateRequest(request);

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'odos_tokenPrices',
                params: [{
                    tokenAddrs: [request.contractAddress.toLowerCase()],
                }],
                id: 1,
            }),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                source: 'QuickNode',
                priceUsd: null,
                raw: { status: response.status, error: errorText },
                error: `HTTP ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json();

        // Check for JSON-RPC error
        if (data.error) {
            return {
                source: 'QuickNode',
                priceUsd: null,
                raw: data,
                error: data.error.message || 'RPC error',
            };
        }

        // Odos returns prices in format: { result: { "<address>": { price: 123.45 } } }
        const tokenAddress = request.contractAddress.toLowerCase();
        const tokenPrice = data.result?.[tokenAddress]?.price;

        return {
            source: 'QuickNode',
            priceUsd: tokenPrice ? parseFloat(tokenPrice) : null,
            raw: data,
            timestamp: Date.now(),
        };
    } catch (error: any) {
        return {
            source: 'QuickNode',
            priceUsd: null,
            raw: null,
            error: error.message,
        };
    }
}

// ============================================================================
// 3. Bitquery - GraphQL Latest Price
// ============================================================================

/**
 * Fetches token price from Bitquery using GraphQL DEX trades
 * 
 * @see https://docs.bitquery.io/docs/examples/dextrades/latest-price/
 * @see https://graphql.bitquery.io/ide
 * 
 * Uses Bitquery's V2 Streaming API to fetch the latest DEX trade price
 * for a token pair. Assumes quote currency is USDC/USDT for USD pricing.
 */
export async function getBitqueryPrice(
    request: TokenPriceRequest
): Promise<TokenPriceResult> {
    const apiKey = process.env.BITQUERY_API_KEY;
    const endpoint = process.env.BITQUERY_GRAPHQL_URL || 'https://streaming.bitquery.io/eap';

    if (!apiKey) {
        return {
            source: 'Bitquery',
            priceUsd: null,
            raw: null,
            error: 'BITQUERY_API_KEY not configured'
        };
    }

    try {
        validateRequest(request);
        const network = getNetworkName(request.chainId).bitquery;

        // USDC addresses for different chains (quote currency)
        const usdcAddresses: Record<string, string> = {
            ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            matic: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            bsc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
            arbitrum: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            optimism: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
            base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            avalanche: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
        };

        const usdcAddress = usdcAddresses[network] || usdcAddresses.ethereum;

        // Bitquery V2 GraphQL query for latest DEX price
        const query = `
      query LatestTokenPrice($network: evm_network, $token: String!, $quoteCurrency: String!) {
        EVM(network: $network) {
          DEXTradeByTokens(
            limit: { count: 1 }
            orderBy: { descending: Block_Time }
            where: {
              Trade: {
                Buy: { Currency: { SmartContract: { is: $token } } }
                Sell: { Currency: { SmartContract: { is: $quoteCurrency } } }
              }
            }
          ) {
            Block {
              Time
            }
            Trade {
              Buy {
                Amount
                Currency {
                  Symbol
                  Name
                }
              }
              Sell {
                Amount
                Currency {
                  Symbol
                }
              }
              price: PriceInUSD
            }
          }
        }
      }
    `;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
            body: JSON.stringify({
                query,
                variables: {
                    network,
                    token: request.contractAddress.toLowerCase(),
                    quoteCurrency: usdcAddress,
                },
            }),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                source: 'Bitquery',
                priceUsd: null,
                raw: { status: response.status, error: errorText },
                error: `HTTP ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json();

        // Check for GraphQL errors
        if (data.errors) {
            return {
                source: 'Bitquery',
                priceUsd: null,
                raw: data,
                error: data.errors[0]?.message || 'GraphQL error',
            };
        }

        // Extract price from latest trade
        const trade = data.data?.EVM?.DEXTradeByTokens?.[0];
        const priceUsd = trade?.Trade?.price;

        return {
            source: 'Bitquery',
            priceUsd: priceUsd ? parseFloat(priceUsd) : null,
            raw: data,
            timestamp: Date.now(),
        };
    } catch (error: any) {
        return {
            source: 'Bitquery',
            priceUsd: null,
            raw: null,
            error: error.message,
        };
    }
}

// ============================================================================
// 4. Ankr - Advanced API
// ============================================================================

/**
 * Fetches token price from Ankr Advanced API
 * 
 * @see https://www.ankr.com/docs/advanced-api/overview/
 * @see https://www.ankr.com/docs/advanced-api/token-methods/
 * 
 * Note: Ankr's Advanced API provides token metadata and balances but does NOT
 * have a native USD price endpoint. For prices, you would need to:
 * 1. Use ankr_getTokenPrice (if available in your plan)
 * 2. Fetch DEX liquidity and calculate price from reserves
 * 3. Use a separate price oracle (CoinGecko, Chainlink, etc.)
 * 
 * This implementation attempts ankr_getTokenPrice but returns null if unavailable.
 */
export async function getAnkrPrice(
    request: TokenPriceRequest
): Promise<TokenPriceResult> {
    const apiKey = process.env.ANKR_API_KEY;

    if (!apiKey) {
        return {
            source: 'Ankr',
            priceUsd: null,
            raw: null,
            error: 'ANKR_API_KEY not configured'
        };
    }

    try {
        validateRequest(request);
        const network = getNetworkName(request.chainId).ankr;

        // Ankr Advanced API endpoint
        const url = `https://rpc.ankr.com/multichain/${apiKey}`;

        // Attempt to use ankr_getTokenPrice (may not be available)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'ankr_getTokenPrice',
                params: {
                    blockchain: network,
                    contractAddress: request.contractAddress.toLowerCase(),
                },
                id: 1,
            }),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            return {
                source: 'Ankr',
                priceUsd: null,
                raw: { status: response.status },
                error: `Ankr does not provide native USD price API. Use CoinGecko, Chainlink, or DEX indexer.`,
            };
        }

        const data = await response.json();

        // Check for method not found (expected)
        if (data.error) {
            return {
                source: 'Ankr',
                priceUsd: null,
                raw: data,
                error: 'Ankr Advanced API does not support direct price queries. Use RPC + price oracle.',
            };
        }

        // If by chance the method exists, parse the result
        const priceUsd = data.result?.usdPrice;

        return {
            source: 'Ankr',
            priceUsd: priceUsd ? parseFloat(priceUsd) : null,
            raw: data,
            timestamp: Date.now(),
        };
    } catch (error: any) {
        return {
            source: 'Ankr',
            priceUsd: null,
            raw: null,
            error: 'Ankr is primarily an RPC provider. For USD prices, integrate CoinGecko or Chainlink.',
        };
    }
}

// ============================================================================
// 5. Generic RPC-Only Providers (Infura, Chainstack, Subsquid)
// ============================================================================

/**
 * Infura price stub
 * 
 * @see https://docs.infura.io/
 * 
 * Infura is a pure RPC provider and does not offer native USD price APIs.
 * To get prices, you must:
 * 1. Use a separate price oracle (CoinGecko, CoinMarketCap, Chainlink)
 * 2. Query DEX smart contracts for liquidity pool reserves
 * 3. Use a DEX aggregator API (1inch, 0x)
 */
export async function getInfuraPrice(
    request: TokenPriceRequest
): Promise<TokenPriceResult> {
    return {
        source: 'Infura',
        priceUsd: null,
        raw: null,
        error: 'Infura is an RPC provider only. No native price API. Use CoinGecko, Chainlink, or DEX indexer.',
    };
}

/**
 * Chainstack price stub
 * 
 * @see https://docs.chainstack.com/
 * 
 * Chainstack is a pure RPC provider and does not offer native USD price APIs.
 * For pricing, integrate external sources like CoinGecko or on-chain oracles.
 */
export async function getChainstackPrice(
    request: TokenPriceRequest
): Promise<TokenPriceResult> {
    return {
        source: 'Chainstack',
        priceUsd: null,
        raw: null,
        error: 'Chainstack is an RPC provider only. No native price API. Use external price oracle.',
    };
}

/**
 * Subsquid price stub
 * 
 * @see https://docs.subsquid.io/
 * 
 * Subsquid is a blockchain indexing framework, not a price provider.
 * You can index DEX trades and calculate prices from historical data,
 * but there's no real-time price API.
 */
export async function getSubsquidPrice(
    request: TokenPriceRequest
): Promise<TokenPriceResult> {
    return {
        source: 'Subsquid',
        priceUsd: null,
        raw: null,
        error: 'Subsquid is a data indexer. For prices, query indexed DEX trades or use CoinGecko.',
    };
}

// ============================================================================
// 6. Unified Interface - Get All Prices
// ============================================================================

/**
 * Fetches token prices from all available providers in parallel
 * 
 * Uses Promise.allSettled to ensure all providers are queried even if some fail.
 * Returns an array of results with source attribution and error handling.
 * 
 * @param request - Token price request parameters
 * @returns Array of price results from all providers
 * 
 * @example
 * ```typescript
 * const results = await getAllPrices({
 *   chainId: 1,
 *   contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
 *   symbol: 'WETH'
 * });
 * 
 * results.forEach(result => {
 *   console.log(`${result.source}: $${result.priceUsd || 'N/A'}`);
 * });
 * ```
 */
export async function getAllPrices(
    request: TokenPriceRequest
): Promise<TokenPriceResult[]> {
    try {
        validateRequest(request);
    } catch (error: any) {
        throw new Error(`Invalid request: ${error.message}`);
    }

    const providers = [
        getAlchemyPrice,
        getQuickNodePrice,
        getBitqueryPrice,
        getAnkrPrice,
        getInfuraPrice,
        getChainstackPrice,
        getSubsquidPrice,
    ];

    const results = await Promise.allSettled(
        providers.map(provider => provider(request))
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            return {
                source: providers[index].name.replace('get', '').replace('Price', ''),
                priceUsd: null,
                raw: null,
                error: result.reason?.message || 'Unknown error',
            };
        }
    });
}

/**
 * Gets the median price from all successful provider responses
 * 
 * Useful for getting a consensus price and filtering out outliers.
 */
export function getMedianPrice(results: TokenPriceResult[]): number | null {
    const prices = results
        .filter(r => r.priceUsd !== null && !isNaN(r.priceUsd!))
        .map(r => r.priceUsd!);

    if (prices.length === 0) return null;

    prices.sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);

    return prices.length % 2 === 0
        ? (prices[mid - 1] + prices[mid]) / 2
        : prices[mid];
}

/**
 * Gets statistics from all provider responses
 */
export function getPriceStats(results: TokenPriceResult[]) {
    const prices = results
        .filter(r => r.priceUsd !== null && !isNaN(r.priceUsd!))
        .map(r => r.priceUsd!);

    if (prices.length === 0) {
        return {
            median: null,
            average: null,
            min: null,
            max: null,
            variance: null,
            successCount: 0,
            totalCount: results.length,
        };
    }

    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = Math.abs((sorted[sorted.length - 1] - sorted[0]) / median) * 100;

    return {
        median,
        average,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        variance,
        successCount: prices.length,
        totalCount: results.length,
    };
}
