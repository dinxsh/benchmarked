// update-benchmarks.ts - Refactored to use in-memory cache instead of MongoDB

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { benchmarkCache } from '../src/lib/benchmark-cache';
import * as adapters from '../src/lib/adapters';
import {
  IProviderAdapter,
  IStreamingAdapter,
  StreamingBenchmarkParams,
  StreamingDataType
} from '../src/lib/benchmark-types';

async function updateBenchmarks() {
  console.log('Starting benchmark update...');

  try {
    const adapterList = Object.values(adapters).map(
      (AdapterClass) => new AdapterClass()
    );

    // Separate regular and streaming adapters
    const regularAdapters = adapterList.filter(
      (adapter) =>
        'measure' in adapter && typeof adapter.measure === 'function'
    ) as IProviderAdapter[];

    const streamingAdapters = adapterList.filter(
      (adapter) =>
        'benchmarkStream' in adapter &&
        typeof adapter.benchmarkStream === 'function'
    ) as IStreamingAdapter[];

    console.log(
      `Found ${regularAdapters.length} regular adapters, ${streamingAdapters.length} streaming adapters`
    );

    // Update regular (REST) providers
    if (regularAdapters.length > 0) {
      console.log('\n=== Updating Regular (REST) Providers ===');
      await Promise.all(
        regularAdapters.map(async (adapter) => {
          console.log(`Measuring ${adapter.name}...`);

          try {
            const metrics = await adapter.measure();
            const metadata = adapter.getMetadata();

            // Store in cache using REST adapter metrics
            // Note: REST adapters don't have streaming-specific metrics
            benchmarkCache.set(metadata.slug, {
              providerId: metadata.id,
              name: metadata.name,
              metrics: {
                // Map REST metrics to streaming format
                connection_latency: metrics.latency_p50,
                first_data_latency: 0,
                message_latency_p50: metrics.latency_p50,
                message_latency_p95: metrics.latency_p95 || 0,
                message_latency_p99: metrics.latency_p99 || 0,
                throughput: 0,
                message_count: 0,
                connection_drops: 0,
                reconnection_count: 0,
                data_completeness: 100,
                uptime_percent: metrics.uptime_percent,
                average_message_size: metrics.response_size_bytes || 0,
                error_rate: metrics.error_rate,
                recovery_time_ms: 0
              }
            });

            console.log(
              `✓ Updated ${adapter.name} (Latency: ${metrics.latency_p50}ms)`
            );
          } catch (e) {
            console.error(`✗ Failed to measure ${adapter.name}:`, e);
          }
        })
      );
    }

    // Update streaming providers
    if (streamingAdapters.length > 0) {
      console.log('\n=== Updating Streaming Providers ===');

      const benchmarkParams: StreamingBenchmarkParams = {
        network: 'ethereum',
        streamType: StreamingDataType.NEW_BLOCKS,
        duration: 30000, // 30 seconds
        expectedMessageRate: 10
      };

      await Promise.all(
        streamingAdapters.map(async (adapter) => {
          console.log(`Benchmarking ${adapter.name}...`);

          try {
            const result = await adapter.benchmarkStream(benchmarkParams);

            if (result.status === 'success') {
              const metadata = adapter.getMetadata();

              // Store in cache
              benchmarkCache.set(adapter.id, {
                providerId: adapter.id,
                name: adapter.name,
                metrics: result.metrics
              });

              console.log(
                `✓ Updated ${adapter.name} - Latency: ${result.metrics.connection_latency}ms, Throughput: ${result.metrics.throughput.toFixed(2)} msg/s`
              );
            } else {
              console.error(`✗ Failed: ${adapter.name} - ${result.error}`);
            }
          } catch (error) {
            console.error(`✗ Error benchmarking ${adapter.name}:`, error);
          }
        })
      );
    }

    console.log('\n=== Benchmark Update Complete ===');
    const stats = benchmarkCache.getStats();
    console.log(`Cache stats: ${stats.totalEntries} providers stored`);
    console.log(
      `Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    );

    process.exit(0);
  } catch (error) {
    console.error('Fatal error during update:', error);
    process.exit(1);
  }
}

updateBenchmarks();
