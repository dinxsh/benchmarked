# Token Price API Configuration Guide

## Required API Keys

To use the token price benchmarking feature, you need to configure API keys for the following providers:

### 1. **Moralis** (REQUIRED)
- **Variable**: `MORALIS_API_KEY`
- **Get API Key**: https://admin.moralis.io/register
- **Free Tier**: Yes (40,000 requests/month)
- **Endpoint**: `https://deep-index.moralis.io/api/v2.2`

### 2. **Bitquery** (REQUIRED)
- **Variable**: `BITQUERY_API_KEY`
- **Get API Key**: https://bitquery.io/forms/api
- **Free Tier**: Yes (limited queries)
- **Endpoint**: `https://streaming.bitquery.io/graphql`

### 3. **Ankr** (REQUIRED)
- **Variable**: `ANKR_API_KEY`
- **Get API Key**: https://www.ankr.com/rpc/
- **Free Tier**: Yes (Premium tier required for token price API)
- **Endpoint**: `https://rpc.ankr.com/multichain/{apiKey}`

### 4. **GoldRush (Covalent)** (OPTIONAL - has default key)
- **Variable**: `GOLDRUSH_API_KEY`
- **Get API Key**: https://www.covalenthq.com/platform/
- **Free Tier**: Yes
- **Default**: Uses demo key if not provided

### 5. **CoinGecko** (OPTIONAL)
- **Variable**: `COINGECKO_API_KEY`
- **Get API Key**: https://www.coingecko.com/en/api/pricing
- **Free Tier**: Yes (works without API key, but rate limited)

## Configuration Steps

1. **Create/Update `.env.local` file** in the project root:

```bash
# Token Price API Keys
MORALIS_API_KEY=your_moralis_api_key_here
BITQUERY_API_KEY=your_bitquery_api_key_here
ANKR_API_KEY=your_ankr_api_key_here

# Optional
GOLDRUSH_API_KEY=your_goldrush_api_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here
```

2. **Restart the development server** after adding API keys:
```bash
npm run dev
```

3. **Test the token price benchmark**:
   - Navigate to http://localhost:3000/dashboard/token-price
   - Click on "WETH" chip
   - Click "🚀 BENCHMARK ALL PROVIDERS"
   - Providers with valid API keys should return successful results

## Provider Status

| Provider | Status | API Key Required | Free Tier |
|----------|--------|------------------|-----------|
| CoinGecko | ✅ Working | No (optional) | Yes |
| GoldRush | ✅ Working | No (has default) | Yes |
| Moralis | ⚠️ Needs API Key | Yes | Yes (40k/month) |
| Ankr | ⚠️ Needs API Key | Yes | Premium tier |
| Bitquery | ⚠️ Needs API Key | Yes | Limited |
| Alchemy | ⊘ N/A | N/A | No price API |
| Infura | ⊘ N/A | N/A | No price API |
| QuickNode | ⊘ N/A | N/A | Requires add-on |
| Chainstack | ⊘ N/A | N/A | No price API |
| Subsquid | ⊘ N/A | N/A | No price API |

## Troubleshooting

### Error: "Moralis API Key required"
- Sign up at https://admin.moralis.io/register
- Copy your API key from the dashboard
- Add `MORALIS_API_KEY=your_key` to `.env.local`

### Error: "Bitquery API Key required"
- Request API key at https://bitquery.io/forms/api
- Add `BITQUERY_API_KEY=your_key` to `.env.local`

### Error: "Ankr API Key required for token price endpoint"
- Get API key from https://www.ankr.com/rpc/
- Note: Token price API requires Premium tier
- Add `ANKR_API_KEY=your_key` to `.env.local`

### All providers showing errors
- Check that `.env.local` exists in project root
- Verify API keys are correct (no extra spaces)
- Restart dev server: `npm run dev`
- Check browser console for detailed error messages
