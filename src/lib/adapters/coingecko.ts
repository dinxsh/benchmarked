import { BaseAdapter } from './base';

export class CoinGeckoAdapter extends BaseAdapter {
    id = 'coingecko';
    name = 'CoinGecko';

    constructor() {
        super();
        this.endpoint = process.env.COINGECKO_ENDPOINT || 'https://api.coingecko.com/api/v3';
    }

    protected async testCall(): Promise<number> {
        const startTime = performance.now();
        try {
            const response = await fetch(`${this.endpoint}/ping`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
            await response.json().catch(() => { });

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
            logo_url: '/providers/coingecko.png',
            website_url: 'https://www.coingecko.com',
            supported_chains: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism', 'base'],
            pricing: {
                free_limit: 10000,
                cost_per_million: 0.0, // Free tier available
                rate_limit: '10-50 req/min'
            },
            capabilities: {
                transactions: false,
                logs: false,
                token_balances: false,
                nft_metadata: false,
                historical_depth: 'full',
                custom_indexing: false,
                traces: false,
                db_access: false
            }
        };
    }

    async getBlockHeight(): Promise<number> {
        // CoinGecko doesn't provide blockchain data, only market data
        return 0;
    }

    protected async captureResponse(): Promise<{ body: any; size: number }> {
        try {
            const response = await fetch(`${this.endpoint}/ping`, {
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
            const apiKey = process.env.COINGECKO_API_KEY || '';
            const platform = this.mapNetworkToPlatform(params.network);

            const headers: Record<string, string> = {};
            if (apiKey) {
                headers['x-cg-pro-api-key'] = apiKey;
            }

            const response = await fetch(
                `${this.endpoint}/simple/token_price/${platform}?contract_addresses=${params.tokenAddress}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
                {
                    method: 'GET',
                    headers,
                    signal: AbortSignal.timeout(5000)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const latency = Math.round(performance.now() - startTime);

            const tokenData = data[params.tokenAddress.toLowerCase()];
            if (!tokenData || !tokenData.usd) {
                throw new Error('No price data in response');
            }

            const price = parseFloat(tokenData.usd);

            return {
                price,
                priceUSD: price.toFixed(2),
                timestamp: new Date().toISOString(),
                latency,
                additionalData: params.mode === 'full' ? {
                    marketCap: tokenData.usd_market_cap?.toString(),
                    volume24h: tokenData.usd_24h_vol?.toString(),
                    priceChange24h: tokenData.usd_24h_change?.toString()
                } : undefined
            };
        } catch (error) {
            throw error;
        }
    }

    private mapNetworkToPlatform(network: string): string {
        const mapping: Record<string, string> = {
            'eth-mainnet': 'ethereum',
            'ethereum': 'ethereum',
            'polygon-mainnet': 'polygon-pos',
            'polygon': 'polygon-pos',
            'arbitrum-mainnet': 'arbitrum-one',
            'arbitrum': 'arbitrum-one',
            'optimism-mainnet': 'optimistic-ethereum',
            'optimism': 'optimistic-ethereum',
            'base-mainnet': 'base',
            'base': 'base',
            'bsc': 'binance-smart-chain',
            'avalanche': 'avalanche'
        };
        return mapping[network] || 'ethereum';
    }
}
