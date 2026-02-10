import { NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'volume';
    const limit = parseInt(searchParams.get('limit') || '20');

    const tokens = dexCache.getUniqueTokens();

    // Sort by requested field
    let sorted = tokens;
    if (sortBy === 'volume') {
      sorted = tokens.sort((a, b) => b.totalVolume24hUSD - a.totalVolume24hUSD);
    } else if (sortBy === 'liquidity') {
      sorted = tokens.sort((a, b) => b.totalLiquidity - a.totalLiquidity);
    } else if (sortBy === 'pairs') {
      sorted = tokens.sort((a, b) => b.pairCount - a.pairCount);
    }

    return NextResponse.json({
      success: true,
      data: sorted.slice(0, limit),
      total: tokens.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
