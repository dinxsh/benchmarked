import { BaseAdapter } from './base';

export class MoralisAdapter extends BaseAdapter {
    id = 'moralis';
    name = 'Moralis';

    constructor() {
        super();
        this.endpoint = process.env.MORALIS_ENDPOINT || 'https://deep-index.moralis.io/api/v2.2';
    }

    protected async testCall(): Promise<number> {
        const startTime = performance.now();
        try {
            const apiKey = process.env.MORALIS_API_KEY || '';
            const response = await fetch(`${this.endpoint}/block/latest?chain=eth`, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey
                },
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
            logo_url: '/providers/moralis.png',
            website_url: 'https://moralis.io',
            supported_chains: ['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom', 'arbitrum', 'optimism'],
            pricing: {
                cost_per_million: 3.0,
                rate_limit: '1500 req/sec'
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
            const apiKey = process.env.MORALIS_API_KEY || '';
            const response = await fetch(`${this.endpoint}/block/latest?chain=eth`, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey
                },
                signal: AbortSignal.timeout(3000)
            });

            if (!response.ok) return 0;
            const data = await response.json();
            return data?.number || 0;
        } catch (error) {
            return 0;
        }
    }

    protected async captureResponse(): Promise<{ body: any; size: number }> {
        try {
            const apiKey = process.env.MORALIS_API_KEY || '';
            const response = await fetch(`${this.endpoint}/block/latest?chain=eth`, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey
                },
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
            const apiKey = process.env.MORALIS_API_KEY || '';
            if (!apiKey) {
                throw new Error('Moralis API Key required');
            }

            const chain = params.network === 'eth-mainnet' ? 'eth' : params.network.replace('-mainnet', '');

            const response = await fetch(
                `${this.endpoint}/erc20/${params.tokenAddress}/price?chain=${chain}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-API-Key': apiKey
                    },
                    signal: AbortSignal.timeout(5000)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const latency = Math.round(performance.now() - startTime);

            const price = parseFloat(data.usdPrice || '0');
            if (!price || isNaN(price)) {
                throw new Error('No price data in response');
            }

            return {
                price,
                priceUSD: price.toFixed(2),
                timestamp: new Date().toISOString(),
                latency,
                additionalData: params.mode === 'full' ? {
                    symbol: data.tokenSymbol,
                    name: data.tokenName,
                    priceChange24h: data['24hrPercentChange']
                } : undefined
            };
        } catch (error) {
            throw error;
        }
    }
}
