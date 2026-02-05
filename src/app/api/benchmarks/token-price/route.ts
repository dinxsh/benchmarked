import { NextResponse } from 'next/server';
import {
    GoldRushAdapter,
    BitqueryAdapter,
    MoralisAdapter,
    CoinGeckoAdapter,
} from '@/lib/adapters';
import { TokenPriceBenchmarkResult, TokenPriceBenchmarkMode } from '@/lib/benchmark-types';

// Provider metadata for token price benchmarking
// Only includes providers with active token price APIs
const providerMetadata = [
    {
        id: 'coingecko',
        name: 'CoinGecko',
        type: 'REST',
        logo: '🦎',
        color: 'var(--chart-1)', // Claude theme green
        hasTokenPrice: true,
        endpoint: '/simple/token_price/{platform}',
        method: 'GET',
        description: 'Aggregated market price data',
        adapter: new CoinGeckoAdapter()
    },
    {
        id: 'moralis',
        name: 'Moralis',
        type: 'REST',
        logo: '🌲',
        color: 'var(--chart-2)', // Claude theme teal
        hasTokenPrice: true,
        endpoint: '/erc20/{address}/price',
        method: 'GET',
        description: 'Real-time token price API',
        adapter: new MoralisAdapter()
    },
    {
        id: 'goldrush',
        name: 'GoldRush',
        type: 'REST',
        logo: '⭐',
        color: 'var(--chart-3)', // Claude theme amber
        hasTokenPrice: true,
        endpoint: '/pricing/historical_by_addresses_v2/{chain}/{quote_currency}/{token_address}/',
        method: 'GET',
        description: 'Token price with historical data',
        adapter: new GoldRushAdapter()
    },
    {
        id: 'bitquery',
        name: 'Bitquery',
        type: 'GraphQL',
        logo: '📊',
        color: 'var(--chart-4)', // Claude theme purple
        hasTokenPrice: true,
        endpoint: 'ethereum { dexTrades { token { price } } }',
        method: 'GraphQL',
        description: 'DEX aggregated pricing',
        adapter: new BitqueryAdapter()
    }
];


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const network = searchParams.get('network') || 'eth-mainnet';
    const mode = searchParams.get('mode') as TokenPriceBenchmarkMode || TokenPriceBenchmarkMode.PRICE_ONLY;

    if (!token) {
        return NextResponse.json({ error: 'Token address or symbol required' }, { status: 400 });
    }

    const results: TokenPriceBenchmarkResult[] = [];

    // Benchmark each provider
    for (const provider of providerMetadata) {
        const result = await benchmarkProvider(provider, token, network, mode);
        results.push(result);
    }

    // Calculate aggregate statistics
    const successResults = results.filter(r => r.status === 'success');
    const stats = calculateStats(successResults);

    return NextResponse.json({
        token,
        network,
        mode,
        results,
        stats,
        timestamp: new Date().toISOString()
    });
}

async function benchmarkProvider(
    provider: typeof providerMetadata[0],
    token: string,
    network: string,
    mode: TokenPriceBenchmarkMode
): Promise<TokenPriceBenchmarkResult> {
    const providerInfo = {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        logo: provider.logo,
        color: provider.color,
        hasTokenPrice: provider.hasTokenPrice,
        endpoint: provider.endpoint,
        method: provider.method,
        description: provider.description
    };

    // If provider doesn't support token price API
    if (!provider.hasTokenPrice || !('getTokenPrice' in provider.adapter)) {
        return {
            provider: providerInfo,
            status: 'unavailable',
            latency: 0,
            price: null,
            error: 'Provider does not support token price API'
        };
    }

    const startTime = performance.now();

    try {
        // Type assertion since we checked above
        const adapterWithPrice = provider.adapter as any;
        const result = await adapterWithPrice.getTokenPrice({
            tokenAddress: token,
            tokenSymbol: token.length < 10 ? token : undefined,
            network,
            mode
        });

        return {
            provider: providerInfo,
            status: 'success',
            latency: result.latency,
            price: result.price,
            priceUSD: result.priceUSD,
            timestamp: result.timestamp,
            additionalData: result.additionalData
        };
    } catch (error) {
        const latency = Math.round(performance.now() - startTime);
        return {
            provider: providerInfo,
            status: 'error',
            latency,
            price: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

function calculateStats(successResults: TokenPriceBenchmarkResult[]) {
    if (successResults.length === 0) {
        return {
            avgLatency: 0,
            successRate: 0,
            fastestProvider: null,
            priceConsensus: 0,
            medianPrice: 0,
            priceVariance: 0,
            minLatency: 0,
            maxLatency: 0,
            minPrice: 0,
            maxPrice: 0
        };
    }

    const prices = successResults.map(r => r.price!);
    const latencies = successResults.map(r => r.latency);

    const avgLatency = Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length);
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const priceVariance = ((maxPrice - minPrice) / minPrice) * 100;
    const priceConsensus = Math.max(0, 100 - priceVariance * 10);

    const fastestResult = successResults.sort((a, b) => a.latency - b.latency)[0];
    const fastestProvider = fastestResult.provider.name;

    const totalProviders = providerMetadata.filter(p => p.hasTokenPrice).length;
    const successRate = (successResults.length / totalProviders) * 100;

    return {
        avgLatency,
        successRate: Math.round(successRate),
        fastestProvider,
        priceConsensus: Math.round(priceConsensus),
        medianPrice: medianPrice.toFixed(2),
        priceVariance: priceVariance.toFixed(2),
        minLatency,
        maxLatency,
        minPrice: minPrice.toFixed(2),
        maxPrice: maxPrice.toFixed(2)
    };
}
