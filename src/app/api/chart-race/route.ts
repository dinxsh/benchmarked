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

// Strip raw HTML from error messages — prevents leaking <!DOCTYPE html> into the UI
function cleanError(text: string, status: number): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('<') || trimmed.startsWith('<!')) return `HTTP ${status}`;
  return trimmed.slice(0, 120);
}

// Read response body safely; returns clean error string if body is HTML
async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return cleanError(text, res.status);
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
    const open  = prices[i].price;
    const close = curr.price;
    return {
      timestamp: new Date(curr.date).toISOString(),
      open,
      high: Math.max(open, close) * 1.001,
      low:  Math.min(open, close) * 0.999,
      close,
      volume: 0,
    };
  });
}

// ── CoinGecko ─────────────────────────────────────────────────────────────────
// Free /ohlc endpoint now requires a demo key (x-cg-demo-api-key).
// Falls back to /market_chart (price array → synthetic OHLCV) if OHLC 404s.
async function fetchCoinGecko(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.COINGECKO_API_KEY ?? process.env.COINGECKO_DEMO_API_KEY ?? '';
    const keyParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : '';
    const keyHeaders: Record<string, string> = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};

    // Primary: /ohlc — real OHLCV
    const ohlcUrl = `https://api.coingecko.com/api/v3/coins/ethereum/ohlc?vs_currency=usd&days=${days}${keyParam}`;
    const ohlcRes = await fetch(ohlcUrl, {
      headers: keyHeaders,
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

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

    // Fallback: /market_chart → hourly prices → synthetic OHLCV
    const chartUrl = `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}&interval=hourly${keyParam}`;
    const chartRes = await fetch(chartUrl, {
      headers: keyHeaders,
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!chartRes.ok) {
      throw new Error(await readErrorBody(chartRes));
    }

    const chartData = await chartRes.json();
    const prices: [number, number][] = chartData?.prices ?? [];
    if (prices.length === 0) throw new Error('No price data returned');

    const pricePoints = prices.map(([ts, price]) => ({
      date: new Date(ts).toISOString(),
      price,
    }));
    const candles = synthesizeOHLCV(pricePoints);
    if (candles.length === 0) throw new Error('Could not synthesize candles');

    return {
      status: 'success',
      latency: Math.round(performance.now() - start),
      candles,
      dataType: 'synthetic',
    };
  } catch (err) {
    return {
      status: 'error',
      latency: Math.round(performance.now() - start),
      candles: [],
      dataType: 'synthetic',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
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
    const from = fromDate.toISOString().split('T')[0];
    const to   = toDate.toISOString().split('T')[0];

    const url = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/eth-mainnet/USD/${WETH}/?key=${apiKey}&from=${from}&to=${to}`;
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

    const data = await res.json();
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

// ── Moralis ───────────────────────────────────────────────────────────────────
async function fetchMoralis(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) throw new Error('MORALIS_API_KEY not configured');

    const timeframe = days <= 1 ? '30min' : days <= 7 ? '4h' : '1d';
    const limit     = days <= 1 ? 48 : days <= 7 ? 42 : days;

    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${WETH}/ohlcv?chain=eth&timeframe=${timeframe}&limit=${limit}&currency=USD`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('Invalid Moralis API key');
      throw new Error(await readErrorBody(res));
    }

    const data    = await res.json();
    const latency = Math.round(performance.now() - start);
    const result: unknown[] = Array.isArray(data) ? data : (data?.result ?? []);
    if (result.length === 0) throw new Error('No OHLCV data returned');

    const candles: OHLCVCandle[] = (result as Record<string, unknown>[]).map(c => ({
      timestamp: new Date(String(c.timestamp)).toISOString(),
      open:   parseFloat(String(c.open)),
      high:   parseFloat(String(c.high)),
      low:    parseFloat(String(c.low)),
      close:  parseFloat(String(c.close)),
      volume: parseFloat(String(c.volume ?? '0')),
    }));

    return { status: 'success', latency, candles, dataType: 'ohlcv' };
  } catch (err) {
    return { status: 'error', latency: Math.round(performance.now() - start), candles: [], dataType: 'ohlcv', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Bitquery ──────────────────────────────────────────────────────────────────
// Uses hourly intervals for days=1 (real-time feel), daily otherwise
async function fetchBitquery(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.BITQUERY_API_KEY;
    if (!apiKey) throw new Error('BITQUERY_API_KEY not configured');

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const since = sinceDate.toISOString().split('T')[0];

    // Use hour-level granularity for 1-day range, day-level otherwise
    const useHour  = days <= 1;
    const interval = useHour ? 'hour(count: 1)' : 'day(count: 1)';
    const orderKey = useHour ? 'timeInterval.hour' : 'timeInterval.day';
    const limit    = useHour ? 24 : Math.min(days * 2, 200);

    const query = `
      {
        ethereum {
          dexTrades(
            options: {limit: ${limit}, desc: "${orderKey}"}
            baseCurrency: {is: "${WETH.toLowerCase()}"}
            quoteCurrency: {is: "${USDC}"}
            date: {since: "${since}"}
          ) {
            timeInterval { ${interval} }
            high:   maximum(of: quote_price)
            low:    minimum(of: quote_price)
            open:   minimum(of: block, get: quote_price)
            close:  maximum(of: block, get: quote_price)
            volume: tradeAmount(in: USD)
          }
        }
      }
    `;

    const res = await fetch('https://graphql.bitquery.io', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(await readErrorBody(res));

    const data    = await res.json();
    const latency = Math.round(performance.now() - start);
    if (data.errors) throw new Error(data.errors[0]?.message || 'Bitquery GraphQL error');

    const trades = data?.data?.ethereum?.dexTrades;
    if (!Array.isArray(trades) || trades.length === 0) throw new Error('No DEX trade data');

    const intervalKey = useHour ? 'hour' : 'day';
    const candles: OHLCVCandle[] = [...trades]
      .reverse()
      .map((t: Record<string, unknown>) => {
        const ti = t.timeInterval as Record<string, unknown> | undefined;
        return {
          timestamp: new Date(String(ti?.[intervalKey] ?? '')).toISOString(),
          open:   parseFloat(String(t.open  ?? '0')),
          high:   parseFloat(String(t.high  ?? '0')),
          low:    parseFloat(String(t.low   ?? '0')),
          close:  parseFloat(String(t.close ?? '0')),
          volume: parseFloat(String(t.volume ?? '0')),
        };
      })
      .filter(c => c.high > 0);

    if (candles.length === 0) throw new Error('No valid candles after filtering');
    return { status: 'success', latency, candles, dataType: 'ohlcv' };
  } catch (err) {
    return { status: 'error', latency: Math.round(performance.now() - start), candles: [], dataType: 'ohlcv', error: err instanceof Error ? err.message : 'Unknown error' };
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

  // candleInterval label for UI display
  const candleInterval = (() => {
    if (provider === 'coingecko') return days <= 1 ? '~30m' : days <= 90 ? '~4h' : '~1d';
    if (provider === 'bitquery')  return days <= 1 ? '~1h'  : '~1d';
    return days <= 1 ? '~30m' : days <= 7 ? '~4h' : '~1d';
  })();

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
