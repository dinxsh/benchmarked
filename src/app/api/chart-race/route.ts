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

// WETH address (used as ETH proxy for DEX-based providers)
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

function getCandleInterval(provider: string, days: number): string {
  if (provider === 'coingecko') {
    if (days <= 1) return '~30m';
    if (days <= 90) return '~4h';
    return '~1d';
  }
  // GoldRush, Moralis, Bitquery: daily candles only
  if (days <= 1) return '~30m';
  if (days <= 7) return '~4h';
  return '~1d';
}

// Synthesize OHLCV from consecutive price points
function synthesizeOHLCV(
  prices: { date: string; price: number }[]
): OHLCVCandle[] {
  if (prices.length < 2) {
    // Single price point: make a flat candle
    if (prices.length === 1) {
      const p = prices[0].price;
      return [
        {
          timestamp: new Date(prices[0].date).toISOString(),
          open: p,
          high: p * 1.001,
          low: p * 0.999,
          close: p,
          volume: 0,
        },
      ];
    }
    return [];
  }

  const candles: OHLCVCandle[] = [];
  for (let i = 1; i < prices.length; i++) {
    const open = prices[i - 1].price;
    const close = prices[i].price;
    const high = Math.max(open, close) * 1.001;
    const low = Math.min(open, close) * 0.999;
    candles.push({
      timestamp: new Date(prices[i].date).toISOString(),
      open,
      high,
      low,
      close,
      volume: 0,
    });
  }
  return candles;
}

async function fetchCoinGecko(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const url = `https://api.coingecko.com/api/v3/coins/ethereum/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    }

    const data: [number, number, number, number, number][] = await res.json();
    const latency = Math.round(performance.now() - start);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No OHLCV data returned');
    }

    const candles: OHLCVCandle[] = data.map(([ts, o, h, l, c]) => ({
      timestamp: new Date(ts).toISOString(),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: 0,
    }));

    return { status: 'success', latency, candles, dataType: 'ohlcv' };
  } catch (err) {
    return {
      status: 'error',
      latency: Math.round(performance.now() - start),
      candles: [],
      dataType: 'ohlcv',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function fetchGoldRush(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.GOLDRUSH_API_KEY;
    if (!apiKey) throw new Error('GOLDRUSH_API_KEY not configured');

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days - 1);
    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    const url = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/eth-mainnet/USD/${WETH}/?key=${apiKey}&from=${from}&to=${to}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      if (res.status === 401) throw new Error('Invalid GoldRush API key');
      if (res.status === 403) throw new Error('GoldRush API key lacks pricing access');
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    }

    const data = await res.json();
    const latency = Math.round(performance.now() - start);

    if (data.error) throw new Error(data.error_message || 'GoldRush API error');

    const priceData = data?.data?.[0];
    if (!priceData?.prices || priceData.prices.length === 0) {
      throw new Error('No price history returned');
    }

    // prices are descending (most recent first) — reverse to ascending
    const sorted: { date: string; price: number }[] = [...priceData.prices]
      .reverse()
      .map((p: { date: string; price: string | number }) => ({
        date: p.date,
        price: parseFloat(String(p.price)),
      }))
      .filter((p) => p.price > 0);

    const candles = synthesizeOHLCV(sorted);
    if (candles.length === 0) throw new Error('Insufficient price data for candles');

    return { status: 'success', latency, candles, dataType: 'synthetic' };
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

async function fetchMoralis(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) throw new Error('MORALIS_API_KEY not configured');

    // Determine timeframe and limit for Moralis OHLCV endpoint
    const timeframe = days <= 1 ? '30min' : days <= 7 ? '4h' : '1d';
    const limit = days <= 1 ? 48 : days <= 7 ? 42 : days;

    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${WETH}/ohlcv?chain=eth&timeframe=${timeframe}&limit=${limit}&currency=USD`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      if (res.status === 401 || res.status === 403) throw new Error('Invalid Moralis API key');
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    }

    const data = await res.json();
    const latency = Math.round(performance.now() - start);

    const result: unknown[] = Array.isArray(data) ? data : (data?.result ?? []);
    if (result.length === 0) throw new Error('No OHLCV data returned');

    const candles: OHLCVCandle[] = (result as Record<string, unknown>[]).map((c) => ({
      timestamp: new Date(String(c.timestamp)).toISOString(),
      open: parseFloat(String(c.open)),
      high: parseFloat(String(c.high)),
      low: parseFloat(String(c.low)),
      close: parseFloat(String(c.close)),
      volume: parseFloat(String(c.volume ?? '0')),
    }));

    return { status: 'success', latency, candles, dataType: 'ohlcv' };
  } catch (err) {
    return {
      status: 'error',
      latency: Math.round(performance.now() - start),
      candles: [],
      dataType: 'ohlcv',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function fetchBitquery(days: number): Promise<Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>> {
  const start = performance.now();
  try {
    const apiKey = process.env.BITQUERY_API_KEY;
    if (!apiKey) throw new Error('BITQUERY_API_KEY not configured');

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const since = sinceDate.toISOString().split('T')[0];

    const query = `
      {
        ethereum {
          dexTrades(
            options: {limit: ${Math.min(days * 4, 200)}, desc: "timeInterval.day"}
            baseCurrency: {is: "${WETH.toLowerCase()}"}
            quoteCurrency: {is: "${USDC}"}
            date: {since: "${since}"}
          ) {
            timeInterval {
              day(count: 1)
            }
            high: maximum(of: quote_price)
            low: minimum(of: quote_price)
            open: minimum(of: block, get: quote_price)
            close: maximum(of: block, get: quote_price)
            volume: tradeAmount(in: USD)
          }
        }
      }
    `;

    const res = await fetch('https://graphql.bitquery.io', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const latency = Math.round(performance.now() - start);

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Bitquery GraphQL error');
    }

    const trades = data?.data?.ethereum?.dexTrades;
    if (!Array.isArray(trades) || trades.length === 0) {
      throw new Error('No DEX trade data returned');
    }

    // Reverse to ascending chronological order
    const candles: OHLCVCandle[] = [...trades]
      .reverse()
      .map((t: Record<string, unknown>) => ({
        timestamp: new Date(String(t.timeInterval && (t.timeInterval as Record<string, unknown>).day)).toISOString(),
        open: parseFloat(String(t.open ?? '0')),
        high: parseFloat(String(t.high ?? '0')),
        low: parseFloat(String(t.low ?? '0')),
        close: parseFloat(String(t.close ?? '0')),
        volume: parseFloat(String(t.volume ?? '0')),
      }))
      .filter((c) => c.high > 0);

    if (candles.length === 0) throw new Error('No valid candles after processing');

    return { status: 'success', latency, candles, dataType: 'ohlcv' };
  } catch (err) {
    return {
      status: 'error',
      latency: Math.round(performance.now() - start),
      candles: [],
      dataType: 'ohlcv',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const daysParam = searchParams.get('days');

  if (!provider || !daysParam) {
    return NextResponse.json(
      { error: 'Missing required params: provider, days' },
      { status: 400 }
    );
  }

  const days = parseInt(daysParam, 10);
  if (isNaN(days) || days <= 0) {
    return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
  }

  const candleInterval = getCandleInterval(provider, days);

  let result: Omit<ChartRaceResponse, 'provider' | 'days' | 'candleInterval'>;

  switch (provider) {
    case 'coingecko':
      result = await fetchCoinGecko(days);
      break;
    case 'goldrush':
      result = await fetchGoldRush(days);
      break;
    case 'moralis':
      result = await fetchMoralis(days);
      break;
    case 'bitquery':
      result = await fetchBitquery(days);
      break;
    default:
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  return NextResponse.json({
    provider,
    days,
    candleInterval,
    ...result,
  } satisfies ChartRaceResponse);
}
