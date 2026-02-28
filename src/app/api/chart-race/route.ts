import { NextResponse } from 'next/server';

interface OHLCVCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartRaceResponse {
  provider: string;
  days: number;
  latency: number;
  status: 'success' | 'error';
  candles: OHLCVCandle[];
  dataType: 'ohlcv' | 'synthetic';
  candleInterval: string;
  error?: string;
}

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

// Never leak raw HTML (e.g. <!DOCTYPE html>) into error messages
async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    const t = text.trim();
    if (t.startsWith('<') || t.startsWith('<!')) return `HTTP ${res.status}`;
    return t.slice(0, 120);
  } catch {
    return `HTTP ${res.status}`;
  }
}

function synthesizeOHLCV(prices: { date: string; price: number }[]): OHLCVCandle[] {
  if (prices.length < 2) {
    if (prices.length === 1) {
      const p = prices[0].price;
      return [{ timestamp: new Date(prices[0].date).toISOString(), open: p, high: p * 1.001, low: p * 0.999, close: p, volume: 0 }];
    }
    return [];
  }
  return prices.slice(1).map((curr, i) => {
    const open = prices[i].price, close = curr.price;
    return {
      timestamp: new Date(curr.date).toISOString(),
      open, close,
      high: Math.max(open, close) * 1.001,
      low:  Math.min(open, close) * 0.999,
      volume: 0,
    };
  });
}

// ── CoinGecko ─────────────────────────────────────────────────────────────────
async function fetchCoinGecko(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey     = process.env.COINGECKO_API_KEY ?? process.env.COINGECKO_DEMO_API_KEY ?? '';
    const keyParam   = apiKey ? `&x_cg_demo_api_key=${apiKey}` : '';
    const keyHeaders: Record<string, string> = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};

    // Try /ohlc first (real OHLCV)
    const ohlcRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/ohlc?vs_currency=usd&days=${days}${keyParam}`,
      { headers: keyHeaders, signal: AbortSignal.timeout(10000), next: { revalidate: 0 } }
    );
    if (ohlcRes.ok) {
      const data: [number, number, number, number, number][] = await ohlcRes.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          status: 'success',
          latency: Math.round(performance.now() - start),
          candles: data.map(([ts, o, h, l, c]) => ({
            timestamp: new Date(ts).toISOString(), open: o, high: h, low: l, close: c, volume: 0,
          })),
          dataType: 'ohlcv',
        };
      }
    }

    // Fallback: /market_chart → synthetic OHLCV
    const chartRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}&interval=hourly${keyParam}`,
      { headers: keyHeaders, signal: AbortSignal.timeout(10000), next: { revalidate: 0 } }
    );
    if (!chartRes.ok) throw new Error(await readErrorBody(chartRes));

    const chartData = await chartRes.json();
    const prices: [number, number][] = chartData?.prices ?? [];
    if (prices.length === 0) throw new Error('No price data');

    const candles = synthesizeOHLCV(prices.map(([ts, price]) => ({ date: new Date(ts).toISOString(), price })));
    if (candles.length === 0) throw new Error('Could not build candles');

    return { status: 'success', latency: Math.round(performance.now() - start), candles, dataType: 'synthetic' };
  } catch (err) {
    return { status: 'error', latency: Math.round(performance.now() - start), candles: [], dataType: 'synthetic', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── GoldRush ──────────────────────────────────────────────────────────────────
async function fetchGoldRush(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.GOLDRUSH_API_KEY;
    if (!apiKey) throw new Error('GOLDRUSH_API_KEY not configured');

    const toDate   = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days - 1);

    const url = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/eth-mainnet/USD/${WETH}/?key=${apiKey}&from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid GoldRush API key');
      if (res.status === 403) throw new Error('GoldRush key lacks pricing access');
      throw new Error(await readErrorBody(res));
    }

    const data    = await res.json();
    const latency = Math.round(performance.now() - start);
    if (data.error) throw new Error(data.error_message || 'GoldRush API error');

    const priceData = data?.data?.[0];
    if (!priceData?.prices?.length) throw new Error('No price history returned');

    const sorted = [...priceData.prices]
      .reverse()
      .map((p: { date: string; price: string | number }) => ({ date: p.date, price: parseFloat(String(p.price)) }))
      .filter(p => p.price > 0);

    const candles = synthesizeOHLCV(sorted);
    if (candles.length === 0) throw new Error('Insufficient price data');

    return { status: 'success', latency, candles, dataType: 'synthetic' };
  } catch (err) {
    return { status: 'error', latency: Math.round(performance.now() - start), candles: [], dataType: 'synthetic', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Bitquery ──────────────────────────────────────────────────────────────────
// Auth: docs.bitquery.io — use "Authorization: Bearer <token>" for V2.
// V1 (graphql.bitquery.io) also accepts X-API-KEY; send both for compatibility.
async function fetchBitquery(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.BITQUERY_API_KEY;
    if (!apiKey) throw new Error('BITQUERY_API_KEY not configured');

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const since = sinceDate.toISOString().split('T')[0];

    // V2 EVM query — uses Authorization: Bearer (as per Bitquery docs)
    const v2Query = `
      {
        EVM(network: eth, dataset: archive) {
          DEXTradeByTokens(
            orderBy: {ascendingByField: "Block_Date"}
            where: {
              Trade: {
                Currency: { SmartContract: { is: "${WETH.toLowerCase()}" } }
                Side:     { Currency: { SmartContract: { is: "${USDC}" } } }
              }
              Block: { Date: { since: "${since}" } }
            }
            limit: { count: ${Math.min(days <= 1 ? 24 : days, 200)} }
          ) {
            Block { Date }
            Trade {
              open:  PriceInUSD(minimum: Block_Number)
              close: PriceInUSD(maximum: Block_Number)
              high:  PriceInUSD(maximum: Trade_PriceInUSD)
              low:   PriceInUSD(minimum: Trade_PriceInUSD)
            }
            volume: sum(of: Trade_Side_AmountInUSD)
          }
        }
      }
    `;

    const res = await fetch('https://streaming.bitquery.io/eap', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-KEY':     apiKey,          // V1 compat header
      },
      body: JSON.stringify({ query: v2Query }),
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(await readErrorBody(res));

    const data    = await res.json();
    const latency = Math.round(performance.now() - start);

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Bitquery GraphQL error');
    }

    const trades = data?.data?.EVM?.DEXTradeByTokens;
    if (!Array.isArray(trades) || trades.length === 0) throw new Error('No DEX trade data');

    const candles: OHLCVCandle[] = trades
      .map((t: Record<string, unknown>) => {
        const block = t.Block as Record<string, unknown>;
        const trade = t.Trade as Record<string, unknown>;
        return {
          timestamp: new Date(String(block?.Date ?? '')).toISOString(),
          open:   parseFloat(String(trade?.open  ?? '0')),
          high:   parseFloat(String(trade?.high  ?? '0')),
          low:    parseFloat(String(trade?.low   ?? '0')),
          close:  parseFloat(String(trade?.close ?? '0')),
          volume: parseFloat(String(t.volume ?? '0')),
        };
      })
      .filter(c => c.high > 0 && !isNaN(c.open));

    if (candles.length === 0) throw new Error('No valid candles after filtering');
    return { status: 'success', latency, candles, dataType: 'ohlcv' };
  } catch (err) {
    return { status: 'error', latency: Math.round(performance.now() - start), candles: [], dataType: 'ohlcv', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Moralis ───────────────────────────────────────────────────────────────────
// Uniswap V3 WETH/USDC 0.05% pair OHLCV via Moralis Deep Index
async function fetchMoralis(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) throw new Error('MORALIS_API_KEY not configured');

    const timeframe = days <= 1 ? '1h' : '1d';
    const limit     = days <= 1 ? 24 : Math.min(days, 200);
    const pair      = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'; // WETH/USDC Uniswap V3

    const url = `https://deep-index.moralis.io/api/v2.2/pairs/${pair}/ohlcv?chain=eth&timeframe=${timeframe}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey, 'accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid Moralis API key');
      throw new Error(await readErrorBody(res));
    }

    const data    = await res.json();
    const latency = Math.round(performance.now() - start);
    const result: unknown[] = data?.result;
    if (!Array.isArray(result) || result.length === 0) throw new Error('No OHLCV data from Moralis');

    const candles: OHLCVCandle[] = result
      .map((r: unknown) => {
        const row = r as Record<string, unknown>;
        return {
          timestamp: new Date(String(row.timestamp ?? row.open_time ?? '')).toISOString(),
          open:   parseFloat(String(row.open   ?? '0')),
          high:   parseFloat(String(row.high   ?? '0')),
          low:    parseFloat(String(row.low    ?? '0')),
          close:  parseFloat(String(row.close  ?? '0')),
          volume: parseFloat(String(row.volume ?? '0')),
        };
      })
      .filter(c => c.high > 0 && !isNaN(c.open));

    if (candles.length === 0) throw new Error('No valid candles from Moralis');
    return { status: 'success', latency, candles, dataType: 'ohlcv' };
  } catch (err) {
    return {
      status: 'error', latency: Math.round(performance.now() - start),
      candles: [], dataType: 'ohlcv',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider  = searchParams.get('provider');
  const daysParam = searchParams.get('days');

  if (!provider || !daysParam) {
    return NextResponse.json({ error: 'Missing required params: provider, days' }, { status: 400 });
  }

  const days = parseInt(daysParam, 10);
  if (isNaN(days) || days <= 0) {
    return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
  }

  const candleInterval =
    provider === 'coingecko' ? (days <= 1 ? '~30m' : days <= 90 ? '~4h' : '~1d') :
    provider === 'moralis'   ? (days <= 1 ? '~1h'  : '~1d') :
    provider === 'bitquery'  ? (days <= 1 ? '~1h'  : '~1d') :
    days <= 1 ? '~30m' : days <= 7 ? '~4h' : '~1d';

  let result: Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>;

  switch (provider) {
    case 'coingecko': result = await fetchCoinGecko(days); break;
    case 'goldrush':  result = await fetchGoldRush(days);  break;
    case 'moralis':   result = await fetchMoralis(days);   break;
    case 'bitquery':  result = await fetchBitquery(days);  break;
    default:
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  return NextResponse.json({ provider, days, candleInterval, ...result } satisfies ChartRaceResponse);
}
