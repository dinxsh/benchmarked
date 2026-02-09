import { NextRequest, NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const newPairs = dexCache.getRecentNewPairs(limit);

    return NextResponse.json({
      success: true,
      count: newPairs.length,
      pairs: newPairs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching new pairs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch new pairs',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
