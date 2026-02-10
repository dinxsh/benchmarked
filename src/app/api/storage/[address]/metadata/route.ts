/**
 * Storage Metadata API Route
 * GET /api/storage/[address]/metadata - Fetch contract metadata only
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageCache } from '@/lib/storage-cache';
import { storageGoldRush } from '@/lib/adapters/storage-goldrush';
import { MetadataAPIResponse } from '@/lib/storage-types';

/**
 * Ethereum address validation regex
 */
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Validate Ethereum address
 */
function isValidAddress(address: string): boolean {
  return ADDRESS_REGEX.test(address);
}

/**
 * GET /api/storage/[address]/metadata
 * Query params:
 * - chainId: Chain ID (default: 1 for Ethereum mainnet)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const startTime = performance.now();

  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);

    // Validate address
    if (!isValidAddress(address)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format'
        } as MetadataAPIResponse,
        { status: 400 }
      );
    }

    // Parse query parameters
    const chainId = parseInt(searchParams.get('chainId') || '1');

    // Check cache first
    const cachedMetadata = storageCache.getContractMetadata(address, chainId);

    if (cachedMetadata) {
      const latency = Math.round(performance.now() - startTime);
      console.log(`[Metadata API] Cache hit for ${address} (${latency}ms)`);

      return NextResponse.json(
        {
          success: true,
          data: cachedMetadata,
          cached: true,
          latency
        } as MetadataAPIResponse,
        {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
          }
        }
      );
    }

    // Cache miss - fetch fresh data
    console.log(`[Metadata API] Cache miss for ${address}, fetching from GoldRush...`);

    const metadata = await storageGoldRush.getContractMetadata(address, chainId);

    // Cache the result (30 minute TTL)
    storageCache.setContractMetadata(address, chainId, metadata);

    const latency = Math.round(performance.now() - startTime);
    console.log(`[Metadata API] Fetched metadata for ${address} in ${latency}ms`);

    return NextResponse.json(
      {
        success: true,
        data: metadata,
        cached: false,
        latency
      } as MetadataAPIResponse,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
        }
      }
    );
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[Metadata API] Error fetching metadata:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contract metadata',
        latency
      } as MetadataAPIResponse,
      { status: 500 }
    );
  }
}
