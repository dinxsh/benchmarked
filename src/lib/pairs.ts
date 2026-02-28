/** Supported token pairs for the streaming race dashboard. */
export interface TokenPair {
  id:             string;   // stable unique key
  label:          string;   // display label, e.g. "ETH / USDC"
  baseSymbol:     string;
  quoteSymbol:    string;
  // GoldRush WS — Uniswap V3 pair address on Ethereum mainnet
  grPairAddress:  string;
  // Bitquery WS — individual ERC-20 addresses
  bqBaseAddress:  string;
  bqQuoteAddress: string;
  // CoinGecko REST — coin ID for /coins/{id}/ohlc
  cgCoinId:       string;
  // Moralis REST — Uniswap V3 pair address (usually same as grPairAddress)
  mlPairAddress:  string;
}

export const TOKEN_PAIRS: TokenPair[] = [
  {
    id:             'eth-usdc',
    label:          'ETH / USDC',
    baseSymbol:     'ETH',
    quoteSymbol:    'USDC',
    grPairAddress:  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', // WETH/USDC 0.05% Uni V3
    bqBaseAddress:  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    bqQuoteAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    cgCoinId:       'ethereum',
    mlPairAddress:  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  },
  {
    id:             'btc-usdc',
    label:          'BTC / USDC',
    baseSymbol:     'BTC',
    quoteSymbol:    'USDC',
    grPairAddress:  '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35', // WBTC/USDC 0.3% Uni V3
    bqBaseAddress:  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    bqQuoteAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    cgCoinId:       'bitcoin',
    mlPairAddress:  '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35',
  },
  {
    id:             'link-usdc',
    label:          'LINK / USDC',
    baseSymbol:     'LINK',
    quoteSymbol:    'USDC',
    grPairAddress:  '0xfad57d2039a21d4af40a26ff35b8eb4d0a1f6e0a', // LINK/USDC 0.3% Uni V3
    bqBaseAddress:  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
    bqQuoteAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    cgCoinId:       'chainlink',
    mlPairAddress:  '0xfad57d2039a21d4af40a26ff35b8eb4d0a1f6e0a',
  },
  {
    id:             'uni-usdc',
    label:          'UNI / USDC',
    baseSymbol:     'UNI',
    quoteSymbol:    'USDC',
    grPairAddress:  '0xd0fc8ba7e267f2bc56044a7715a489d851dc6d78', // UNI/USDC 0.3% Uni V3
    bqBaseAddress:  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
    bqQuoteAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    cgCoinId:       'uniswap',
    mlPairAddress:  '0xd0fc8ba7e267f2bc56044a7715a489d851dc6d78',
  },
];

export const DEFAULT_PAIR = TOKEN_PAIRS[0];
