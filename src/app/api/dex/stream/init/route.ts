import { NextResponse } from 'next/server';
import { MegaETHStreamingAdapter } from '@/lib/adapters/megaeth-streaming';
import { dexCache } from '@/lib/dex-cache';

// Global streaming state (persists across requests)
let streamingActive = false;
let unsubscribers: (() => void)[] = [];

export async function POST() {
  try {
    if (streamingActive) {
      return NextResponse.json({
        success: true,
        message: 'Streaming already active',
        pairsTracked: dexCache.getAllPairs().length
      });
    }

    const adapter = new MegaETHStreamingAdapter();

    // Start new pairs stream
    const unsubNewPairs = await adapter.subscribeToNewPairs((pair) => {
      dexCache.addNewPair(pair);
      console.log(`[Stream] New pair detected: ${pair.token0.symbol}/${pair.token1.symbol}`);
    });
    unsubscribers.push(unsubNewPairs);

    // Start OHLCV stream for top 20
    const topPairs = dexCache.getTopPairsByVolume(20);
    if (topPairs.length > 0) {
      const unsubOHLCV = await adapter.subscribeToOHLCV(
        topPairs.map(p => p.pair.pairAddress),
        '1m',
        (candle) => {
          dexCache.addOHLCVCandle(candle.pairAddress, candle);
        }
      );
      unsubscribers.push(unsubOHLCV);
    }

    streamingActive = true;

    return NextResponse.json({
      success: true,
      message: 'Streaming initialized',
      pairsTracked: topPairs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error initializing streaming:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize streaming',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Stop all streams
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
    streamingActive = false;

    return NextResponse.json({
      success: true,
      message: 'Streaming stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error stopping streaming:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to stop streaming',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    streamingActive,
    activeStreams: unsubscribers.length,
    cacheStats: dexCache.getStats(),
    timestamp: new Date().toISOString()
  });
}
