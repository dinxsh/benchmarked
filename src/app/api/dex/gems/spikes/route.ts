import { NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET() {
  try {
    const spikes = dexCache.detectVolumeSpikes();

    // Add gem scores
    const spikesWithScores = spikes.map(s => ({
      ...s,
      gemScore: dexCache.calculateGemScore(s.pair.pairAddress)
    }));

    return NextResponse.json({
      success: true,
      count: spikesWithScores.length,
      spikes: spikesWithScores,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error detecting volume spikes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect volume spikes',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
