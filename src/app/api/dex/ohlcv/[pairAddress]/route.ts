import { NextRequest, NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pairAddress: string }> }
) {
  try {
    const { pairAddress } = await params;
    const { searchParams } = new URL(request.url);
    const points = parseInt(searchParams.get('points') || '100');

    const ohlcv = dexCache.getOHLCVHistory(pairAddress, points);

    return NextResponse.json({
      success: true,
      pairAddress,
      count: ohlcv.length,
      data: ohlcv,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching OHLCV data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch OHLCV data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
