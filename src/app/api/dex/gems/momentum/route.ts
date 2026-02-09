import { NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const timeWindow = parseInt(searchParams.get('window') || '3600000'); // 1 hour default

    const momentumPairs = dexCache.getTopMomentumPairs(limit, timeWindow);

    // Add gem scores
    const pairsWithScores = momentumPairs.map(p => ({
      ...p,
      gemScore: dexCache.calculateGemScore(p.pair.pairAddress)
    }));

    return NextResponse.json({
      success: true,
      count: pairsWithScores.length,
      timeWindow: `${timeWindow / 60000} minutes`,
      pairs: pairsWithScores,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error fetching momentum pairs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch momentum pairs',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
