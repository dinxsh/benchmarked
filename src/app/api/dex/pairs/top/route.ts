import { NextRequest, NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'volume'; // volume or liquidity
    const limit = parseInt(searchParams.get('limit') || '20');

    const topPairs = sortBy === 'liquidity'
      ? dexCache.getTopPairsByLiquidity(limit)
      : dexCache.getTopPairsByVolume(limit);

    return NextResponse.json({
      success: true,
      count: topPairs.length,
      pairs: topPairs,
      sortedBy: sortBy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching top pairs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top pairs',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
