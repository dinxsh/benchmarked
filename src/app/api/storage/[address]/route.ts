/**
 * Storage API Route
 * GET /api/storage/[address] - Fetch contract storage slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageCache } from '@/lib/storage-cache';
import { storageRPC } from '@/lib/adapters/storage-rpc';
import { storageGoldRush } from '@/lib/adapters/storage-goldrush';
import { storageDecoder } from '@/lib/adapters/storage-decoder';
import { ContractStorage, StorageAPIResponse } from '@/lib/storage-types';

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
 * GET /api/storage/[address]
 * Query params:
 * - chainId: Chain ID (default: 1 for Ethereum mainnet)
 * - start: Start slot number (default: 0)
 * - end: End slot number (default: 255)
 * - blockTag: Block number or 'latest' (default: 'latest')
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
        } as StorageAPIResponse,
        { status: 400 }
      );
    }

    // Parse query parameters
    const chainId = parseInt(searchParams.get('chainId') || '1');
    const start = parseInt(searchParams.get('start') || '0');
    const end = parseInt(searchParams.get('end') || '255');
    const blockTag = searchParams.get('blockTag') || 'latest';

    // Validate parameters
    if (start < 0 || end < 0 || start > end) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid slot range. Start and end must be non-negative, with start <= end'
        } as StorageAPIResponse,
        { status: 400 }
      );
    }

    if (end - start > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slot range too large. Maximum range is 1000 slots per request'
        } as StorageAPIResponse,
        { status: 400 }
      );
    }

    // Check cache first
    const cachedStorage = storageCache.getContractStorage(address, chainId, start, end);

    if (cachedStorage) {
      const latency = Math.round(performance.now() - startTime);
      console.log(`[Storage API] Cache hit for ${address} (${latency}ms)`);

      return NextResponse.json(
        {
          success: true,
          data: cachedStorage,
          cached: true,
          latency
        } as StorageAPIResponse,
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
          }
        }
      );
    }

    // Cache miss - fetch fresh data
    console.log(`[Storage API] Cache miss for ${address}, fetching from RPC...`);

    // Verify it's a contract
    const isContract = await storageRPC.isContract(address);
    if (!isContract) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address is not a contract or does not exist'
        } as StorageAPIResponse,
        { status: 404 }
      );
    }

    // Fetch metadata (cached separately)
    let metadata;
    try {
      metadata = await storageGoldRush.getContractMetadata(address, chainId);
    } catch (error) {
      console.warn('[Storage API] Failed to fetch metadata:', error);
      // Continue without metadata
    }

    // Generate slot numbers array
    const slots: number[] = [];
    for (let i = start; i <= end; i++) {
      slots.push(i);
    }

    // Fetch storage slots in batch
    const slotsMap = await storageRPC.getBatchStorageSlots({
      address,
      slots,
      blockTag,
      chainId
    });

    // Get current block number
    let blockNumber: number | undefined;
    try {
      blockNumber = await storageRPC.getBlockNumber();
    } catch (error) {
      console.warn('[Storage API] Failed to fetch block number:', error);
    }

    // Decode slots
    const decodedSlots = storageDecoder.decodeSlots(
      slotsMap,
      metadata?.storageLayout
    );

    // Build contract storage object
    const contractStorage: ContractStorage = {
      address,
      chainId,
      slots: decodedSlots,
      metadata,
      slotRange: { start, end },
      totalSlotsFetched: decodedSlots.length,
      fetchedAt: Date.now(),
      blockNumber
    };

    // Cache the result
    storageCache.setContractStorage(address, chainId, contractStorage);

    const latency = Math.round(performance.now() - startTime);
    console.log(`[Storage API] Fetched ${decodedSlots.length} slots for ${address} in ${latency}ms`);

    return NextResponse.json(
      {
        success: true,
        data: contractStorage,
        cached: false,
        latency
      } as StorageAPIResponse,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[Storage API] Error fetching storage:', errorMessage);

    // Check for rate limit errors
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          latency
        } as StorageAPIResponse,
        { status: 429 }
      );
    }

    // Check for timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timed out. Please try again.',
          latency
        } as StorageAPIResponse,
        { status: 504 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contract storage',
        latency
      } as StorageAPIResponse,
      { status: 500 }
    );
  }
}
