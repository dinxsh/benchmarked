import { NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const timeframe = (searchParams.get('timeframe') || '24h') as '1h' | '24h';
    const direction = searchParams.get('direction') || 'gainers'; // gainers or losers

    const pairs = direction === 'gainers'
      ? dexCache.getTopGainers(limit, timeframe)
      : dexCache.getTopLosers(limit, timeframe);

    // Add gem scores
    const pairsWithScores = pairs.map(p => ({
      ...p,
      gemScore: dexCache.calculateGemScore(p.pair.pairAddress)
    }));

    return NextResponse.json({
      success: true,
      count: pairsWithScores.length,
      direction,
      timeframe,
      pairs: pairsWithScores,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error fetching gainers/losers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gainers/losers',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
