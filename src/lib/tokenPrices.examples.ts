/**
 * Token Price Fetcher - Usage Examples
 * 
 * Demonstrates how to use the tokenPrices module to fetch USD prices
 * from multiple infrastructure providers.
 */

import {
    getAllPrices,
    getMedianPrice,
    getPriceStats,
    getAlchemyPrice,
    getQuickNodePrice,
    getBitqueryPrice,
    type TokenPriceRequest,
    type TokenPriceResult,
} from './tokenPrices';

// ============================================================================
// Example 1: Fetch prices from all providers
// ============================================================================

async function example1_getAllPrices() {
    console.log('=== Example 1: Get All Prices ===\n');

    const request: TokenPriceRequest = {
        chainId: 1, // Ethereum mainnet
        contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        symbol: 'WETH',
    };

    const results = await getAllPrices(request);

    console.log(`Token: ${request.symbol || request.contractAddress}`);
    console.log(`Chain ID: ${request.chainId}\n`);

    results.forEach(result => {
        if (result.priceUsd !== null) {
            console.log(`✅ ${result.source.padEnd(15)} $${result.priceUsd.toFixed(2)}`);
        } else {
            console.log(`❌ ${result.source.padEnd(15)} ${result.error || 'No price available'}`);
        }
    });

    // Get median price
    const median = getMedianPrice(results);
    console.log(`\n📊 Median Price: $${median?.toFixed(2) || 'N/A'}`);

    // Get statistics
    const stats = getPriceStats(results);
    console.log(`📈 Average Price: $${stats.average?.toFixed(2) || 'N/A'}`);
    console.log(`📉 Price Range: $${stats.min?.toFixed(2)} - $${stats.max?.toFixed(2)}`);
    console.log(`📊 Variance: ${stats.variance?.toFixed(2)}%`);
    console.log(`✅ Success Rate: ${stats.successCount}/${stats.totalCount}\n`);
}

// ============================================================================
// Example 2: Fetch from specific provider
// ============================================================================

async function example2_specificProvider() {
    console.log('=== Example 2: Specific Provider (Alchemy) ===\n');

    const request: TokenPriceRequest = {
        chainId: 1,
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        symbol: 'USDC',
    };

    const result = await getAlchemyPrice(request);

    console.log(`Provider: ${result.source}`);
    console.log(`Price: $${result.priceUsd?.toFixed(6) || 'N/A'}`);
    console.log(`Timestamp: ${result.timestamp ? new Date(result.timestamp).toISOString() : 'N/A'}`);
    console.log(`Error: ${result.error || 'None'}`);
    console.log(`Raw Response:`, JSON.stringify(result.raw, null, 2), '\n');
}

// ============================================================================
// Example 3: Multi-chain price comparison
// ============================================================================

async function example3_multiChain() {
    console.log('=== Example 3: Multi-Chain Price Comparison ===\n');

    // USDC on different chains
    const tokens = [
        { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USDC (Ethereum)' },
        { chainId: 137, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', name: 'USDC (Polygon)' },
        { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', name: 'USDC (Arbitrum)' },
    ];

    for (const token of tokens) {
        const results = await getAllPrices({
            chainId: token.chainId,
            contractAddress: token.address,
        });

        const median = getMedianPrice(results);
        const successCount = results.filter(r => r.priceUsd !== null).length;

        console.log(`${token.name}:`);
        console.log(`  Median Price: $${median?.toFixed(6) || 'N/A'}`);
        console.log(`  Providers: ${successCount}/${results.length} successful\n`);
    }
}

// ============================================================================
// Example 4: Error handling and retries
// ============================================================================

async function example4_errorHandling() {
    console.log('=== Example 4: Error Handling ===\n');

    // Invalid address
    try {
        await getAllPrices({
            chainId: 1,
            contractAddress: '', // Invalid
        });
    } catch (error: any) {
        console.log(`❌ Caught validation error: ${error.message}\n`);
    }

    // Valid request but some providers may fail
    const results = await getAllPrices({
        chainId: 1,
        contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
    });

    console.log('Provider Results:');
    results.forEach(result => {
        if (result.error) {
            console.log(`  ${result.source}: ❌ ${result.error}`);
        } else {
            console.log(`  ${result.source}: ✅ $${result.priceUsd?.toFixed(2)}`);
        }
    });
    console.log();
}

// ============================================================================
// Example 5: Real-time price monitoring
// ============================================================================

async function example5_priceMonitoring() {
    console.log('=== Example 5: Price Monitoring (3 iterations) ===\n');

    const request: TokenPriceRequest = {
        chainId: 1,
        contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        symbol: 'WETH',
    };

    for (let i = 0; i < 3; i++) {
        const results = await getAllPrices(request);
        const median = getMedianPrice(results);
        const stats = getPriceStats(results);

        console.log(`[${new Date().toLocaleTimeString()}] WETH Price:`);
        console.log(`  Median: $${median?.toFixed(2)}`);
        console.log(`  Range: $${stats.min?.toFixed(2)} - $${stats.max?.toFixed(2)}`);
        console.log(`  Variance: ${stats.variance?.toFixed(2)}%\n`);

        // Wait 5 seconds before next iteration
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

// ============================================================================
// Example 6: Batch price fetching
// ============================================================================

async function example6_batchFetching() {
    console.log('=== Example 6: Batch Price Fetching ===\n');

    const tokens = [
        { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH' },
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC' },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
        { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI' },
    ];

    const allResults = await Promise.all(
        tokens.map(token =>
            getAllPrices({
                chainId: 1,
                contractAddress: token.address,
                symbol: token.symbol,
            })
        )
    );

    tokens.forEach((token, index) => {
        const results = allResults[index];
        const median = getMedianPrice(results);
        const stats = getPriceStats(results);

        console.log(`${token.symbol}:`);
        console.log(`  Price: $${median?.toFixed(2) || 'N/A'}`);
        console.log(`  Providers: ${stats.successCount}/${stats.totalCount}`);
        console.log(`  Variance: ${stats.variance?.toFixed(2)}%\n`);
    });
}

// ============================================================================
// Run examples
// ============================================================================

async function main() {
    try {
        // Run all examples
        await example1_getAllPrices();
        await example2_specificProvider();
        await example3_multiChain();
        await example4_errorHandling();
        await example5_priceMonitoring();
        await example6_batchFetching();

        console.log('✅ All examples completed successfully!');
    } catch (error) {
        console.error('❌ Error running examples:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

export {
    example1_getAllPrices,
    example2_specificProvider,
    example3_multiChain,
    example4_errorHandling,
    example5_priceMonitoring,
    example6_batchFetching,
};
