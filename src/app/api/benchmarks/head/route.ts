import { NextResponse } from 'next/server';
import * as adapters from '@/lib/adapters';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adapterInstances = Object.values(adapters).map(
    (AdapterClass) => new AdapterClass()
  );

  // Filter out streaming adapters - they don't have getBlockHeight() method
  const regularAdapters = adapterInstances.filter(
    (adapter) => 'getBlockHeight' in adapter && typeof adapter.getBlockHeight === 'function'
  ) as any[];

  // Execute all requests in parallel
  const results = await Promise.all(
    regularAdapters.map(async (adapter) => {
      const start = performance.now();
      const height = await adapter.getBlockHeight();
      const latency = Math.round(performance.now() - start);

      return {
        id: adapter.id,
        name: adapter.name,
        blockHeight: height,
        latency // Latency for THIS specific block check
      };
    })
  );

  // Find the max block height (the "current" head)
  const maxBlock = Math.max(...results.map((r) => r.blockHeight));

  // Add "blocks behind" metric
  const finalResults = results.map((r) => ({
    ...r,
    blocksBehind: r.blockHeight > 0 ? maxBlock - r.blockHeight : -1,
    status:
      r.blockHeight > 0
        ? r.blockHeight === maxBlock
          ? 'leading'
          : 'lagging'
        : 'error'
  }));

  // Sort by block height (desc) then latency (asc)
  finalResults.sort((a, b) => {
    if (b.blockHeight !== a.blockHeight) return b.blockHeight - a.blockHeight;
    return a.latency - b.latency;
  });

  return NextResponse.json({
    latestBlock: maxBlock,
    providers: finalResults,
    timestamp: new Date().toISOString()
  });
}
