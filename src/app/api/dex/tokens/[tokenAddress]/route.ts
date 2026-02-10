import { NextResponse } from 'next/server';
import { dexCache } from '@/lib/dex-cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenAddress: string }> }
) {
  try {
    const { tokenAddress } = await params;
    const pairs = dexCache.getPairsForToken(tokenAddress);

    if (pairs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Token not found or no pairs available' },
        { status: 404 }
      );
    }

    // Calculate aggregated metrics
    const totalVolume = pairs.reduce((sum, p) => sum + p.volume24hUSD, 0);
    const totalLiquidity = pairs.reduce((sum, p) => sum + p.liquidityUSD, 0);
    const avgPrice = pairs.reduce((sum, p) => sum + p.priceUSD, 0) / pairs.length;

    return NextResponse.json({
      success: true,
      data: {
        token: pairs[0].pair.token0.address.toLowerCase() === tokenAddress.toLowerCase()
          ? pairs[0].pair.token0
          : pairs[0].pair.token1,
        pairs,
        aggregated: {
          totalVolume24hUSD: totalVolume,
          totalLiquidity,
          avgPriceUSD: avgPrice,
          pairCount: pairs.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
