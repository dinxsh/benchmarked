# Token Price Fetcher

A comprehensive TypeScript module for fetching USD token prices from multiple blockchain infrastructure providers.

## Features

- ✅ **Multi-Provider Support**: Alchemy, QuickNode, Bitquery, Ankr, and more
- ✅ **Parallel Fetching**: Uses `Promise.allSettled` for concurrent requests
- ✅ **Error Handling**: Graceful degradation with detailed error messages
- ✅ **Type Safety**: Full TypeScript support with strict types
- ✅ **Statistics**: Median, average, variance, and consensus calculations
- ✅ **Multi-Chain**: Supports Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche

## Installation

```bash
# No external dependencies required (uses native fetch)
# Just copy tokenPrices.ts to your project
```

## Environment Variables

Create a `.env` file with your API keys:

```env
# Required for Alchemy
ALCHEMY_API_KEY=your_alchemy_key_here

# Required for QuickNode
QUICKNODE_RPC_URL=https://your-quicknode-endpoint.com

# Required for Bitquery
BITQUERY_API_KEY=your_bitquery_key_here
BITQUERY_GRAPHQL_URL=https://streaming.bitquery.io/eap

# Required for Ankr
ANKR_API_KEY=your_ankr_key_here
```

## Quick Start

```typescript
import { getAllPrices, getMedianPrice } from './tokenPrices';

// Fetch WETH price from all providers
const results = await getAllPrices({
  chainId: 1, // Ethereum mainnet
  contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH'
});

// Get median price
const median = getMedianPrice(results);
console.log(`WETH Price: $${median?.toFixed(2)}`);

// Check individual providers
results.forEach(result => {
  console.log(`${result.source}: $${result.priceUsd || 'N/A'}`);
});
```

## API Reference

### Types

```typescript
interface TokenPriceRequest {
  chainId: number;           // Chain ID (1 = Ethereum, 137 = Polygon, etc.)
  contractAddress: string;   // Token contract address
  symbol?: string;           // Optional token symbol
}

interface TokenPriceResult {
  source: string;            // Provider name
  priceUsd: number | null;   // USD price or null if unavailable
  raw: any;                  // Raw API response
  error?: string;            // Error message if failed
  timestamp?: number;        // Unix timestamp
}
```

### Functions

#### `getAllPrices(request: TokenPriceRequest): Promise<TokenPriceResult[]>`

Fetches token prices from all available providers in parallel.

```typescript
const results = await getAllPrices({
  chainId: 1,
  contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
});
```

#### `getMedianPrice(results: TokenPriceResult[]): number | null`

Calculates the median price from all successful responses.

```typescript
const median = getMedianPrice(results);
```

#### `getPriceStats(results: TokenPriceResult[])`

Returns comprehensive statistics about the price data.

```typescript
const stats = getPriceStats(results);
console.log(stats);
// {
//   median: 2147.62,
//   average: 2148.45,
//   min: 2142.54,
//   max: 2154.89,
//   variance: 0.57,
//   successCount: 3,
//   totalCount: 7
// }
```

#### Provider-Specific Functions

```typescript
// Fetch from specific provider
const alchemyResult = await getAlchemyPrice(request);
const quicknodeResult = await getQuickNodePrice(request);
const bitqueryResult = await getBitqueryPrice(request);
const ankrResult = await getAnkrPrice(request);
```

## Supported Providers

### 1. Alchemy ✅
- **API**: Prices API
- **Docs**: https://docs.alchemy.com/reference/alchemy-getTokenPrice
- **Status**: Fully supported
- **Chains**: Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche

### 2. QuickNode ✅
- **API**: Odos Token Pricing Add-On
- **Docs**: https://marketplace.quicknode.com/add-on/odos-token-pricing
- **Status**: Fully supported
- **Method**: `odos_tokenPrices` (JSON-RPC)

### 3. Bitquery ✅
- **API**: GraphQL V2 Streaming API
- **Docs**: https://docs.bitquery.io/docs/examples/dextrades/latest-price/
- **Status**: Fully supported
- **Method**: DEX trade price via GraphQL

### 4. Ankr ⚠️
- **API**: Advanced API
- **Docs**: https://www.ankr.com/docs/advanced-api/
- **Status**: Limited (no native price endpoint)
- **Note**: Returns null; use external price oracle

### 5. Infura ❌
- **Status**: RPC only, no price API
- **Alternative**: Use CoinGecko, Chainlink, or DEX indexer

### 6. Chainstack ❌
- **Status**: RPC only, no price API
- **Alternative**: Use external price oracle

### 7. Subsquid ❌
- **Status**: Data indexer, not a price provider
- **Alternative**: Query indexed DEX trades or use CoinGecko

## Supported Chains

| Chain ID | Network | Alchemy | QuickNode | Bitquery | Ankr |
|----------|---------|---------|-----------|----------|------|
| 1 | Ethereum | ✅ | ✅ | ✅ | ⚠️ |
| 137 | Polygon | ✅ | ✅ | ✅ | ⚠️ |
| 56 | BSC | ✅ | ✅ | ✅ | ⚠️ |
| 42161 | Arbitrum | ✅ | ✅ | ✅ | ⚠️ |
| 10 | Optimism | ✅ | ✅ | ✅ | ⚠️ |
| 8453 | Base | ✅ | ✅ | ✅ | ⚠️ |
| 43114 | Avalanche | ✅ | ✅ | ✅ | ⚠️ |

## Examples

See `tokenPrices.examples.ts` for comprehensive usage examples:

1. **Get All Prices**: Fetch from all providers
2. **Specific Provider**: Query individual provider
3. **Multi-Chain**: Compare prices across chains
4. **Error Handling**: Handle failures gracefully
5. **Price Monitoring**: Real-time price tracking
6. **Batch Fetching**: Fetch multiple tokens

## Error Handling

All functions return results with error information:

```typescript
const result = await getAlchemyPrice(request);

if (result.error) {
  console.error(`Error: ${result.error}`);
} else {
  console.log(`Price: $${result.priceUsd}`);
}
```

## Best Practices

1. **Use Median Price**: More reliable than single source
2. **Check Variance**: High variance indicates data quality issues
3. **Handle Nulls**: Not all providers support all chains/tokens
4. **Rate Limiting**: Implement delays for production use
5. **Caching**: Cache results to reduce API calls

## Performance

- **Parallel Execution**: All providers queried simultaneously
- **Timeout**: 5-10 second timeout per provider
- **Non-Blocking**: Failed providers don't block others
- **Efficient**: Uses native `fetch` (no external dependencies)

## Limitations

1. **Ankr**: No native price API (returns null)
2. **Infura/Chainstack**: RPC only (returns null)
3. **Subsquid**: Data indexer (returns null)
4. **Rate Limits**: Subject to provider rate limits
5. **Chain Support**: Not all providers support all chains

## Troubleshooting

### "API key not configured"
- Ensure environment variables are set correctly
- Check `.env` file is in the correct location

### "No price data available"
- Token may not be supported on that chain
- Provider may be experiencing issues
- Check raw response for details

### "HTTP 401/403"
- Invalid API key
- API key may not have required permissions

### "Timeout"
- Network issues
- Provider API is slow/down
- Increase timeout in fetch options

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- TypeScript strict mode compliance
- Comprehensive error handling
- JSDoc comments with external doc links
- Examples for new features
