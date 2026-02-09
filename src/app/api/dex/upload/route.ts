import { NextRequest, NextResponse } from 'next/server';
import { DexPairLoader } from '@/lib/dex-pair-loader';
import { dexCache } from '@/lib/dex-cache';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const csvContent = await file.text();
    const loader = new DexPairLoader();
    const pairs = await loader.loadPairsFromCSV(csvContent);

    // Initialize cache with pairs
    pairs.forEach(pair => dexCache.addNewPair(pair));

    return NextResponse.json({
      success: true,
      loaded: pairs.length,
      pairs: pairs.map(p => ({
        pairAddress: p.pairAddress,
        symbol: `${p.token0.symbol}/${p.token1.symbol}`,
        dex: p.dexName
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error uploading CSV:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process CSV',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
