import { NextResponse } from 'next/server';
import {
  MegaETHStreamingAdapter,
  ZerionStreamingAdapter,
  AlchemyStreamingAdapter,
  InfuraStreamingAdapter,
  QuickNodeStreamingAdapter,
  AnkrStreamingAdapter
} from '@/lib/adapters';
import {
  StreamingBenchmarkParams,
  StreamingBenchmarkResult,
  StreamingDataType,
  StreamingProviderInfo
} from '@/lib/benchmark-types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const streamingAdapters = [
  new MegaETHStreamingAdapter(),
  new ZerionStreamingAdapter(),
  new AlchemyStreamingAdapter(),
  new InfuraStreamingAdapter(),
  new QuickNodeStreamingAdapter(),
  new AnkrStreamingAdapter()
];

const GOLDRUSH_STREAM_ENDPOINT =
  process.env.VITE_GOLDRUSH_STREAM_URL ||
  process.env.GOLDRUSH_STREAM_URL ||
  'wss://gr-staging-v2.streaming.covalenthq.com/graphql';

const providerMetadata: StreamingProviderInfo[] = [
  {
    id: 'goldrush-streaming',
    name: 'GoldRush Streaming',
    type: 'WebSocket',
    logo: '⚡',
    color: '#E6A23C',
    hasStreaming: true,
    endpoint: GOLDRUSH_STREAM_ENDPOINT,
    protocol: 'WebSocket',
    description: 'Ultra-fast blockchain streaming by GoldRush - sub-50ms latency',
    adapter: streamingAdapters[0]
  },
  {
    id: 'zerion',
    name: 'Zerion',
    type: 'WebSocket',
    logo: '💜',
    color: '#5B4AE2',
    hasStreaming: true,
    endpoint: 'wss://api.zerion.io/v1/websocket',
    protocol: 'WebSocket',
    description: 'DeFi-focused real-time data streaming',
    adapter: streamingAdapters[1]
  },
  {
    id: 'alchemy-ws',
    name: 'Alchemy WebSocket',
    type: 'WebSocket',
    logo: '⚗️',
    color: '#4F46E5',
    hasStreaming: true,
    endpoint: 'wss://eth-mainnet.g.alchemy.com/v2',
    protocol: 'WebSocket',
    description: 'Enterprise-grade blockchain data streams',
    adapter: streamingAdapters[2]
  },
  {
    id: 'infura-ws',
    name: 'Infura WebSocket',
    type: 'WebSocket',
    logo: '🔥',
    color: '#FF6B35',
    hasStreaming: true,
    endpoint: 'wss://mainnet.infura.io/ws/v3',
    protocol: 'WebSocket',
    description: 'Reliable blockchain infrastructure',
    adapter: streamingAdapters[3]
  },
  {
    id: 'quicknode-ws',
    name: 'QuickNode WebSocket',
    type: 'WebSocket',
    logo: '⚡',
    color: '#1DA1F2',
    hasStreaming: true,
    endpoint: 'wss://api.quicknode.com/v1',
    protocol: 'WebSocket',
    description: 'High-performance blockchain APIs',
    adapter: streamingAdapters[4]
  },
  {
    id: 'ankr-ws',
    name: 'Ankr WebSocket',
    type: 'WebSocket',
    logo: '⚓',
    color: '#00D4AA',
    hasStreaming: true,
    endpoint: 'wss://rpc.ankr.com',
    protocol: 'WebSocket',
    description: 'Multi-chain streaming infrastructure',
    adapter: streamingAdapters[5]
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network') || 'ethereum';
  const streamType = searchParams.get('streamType') || StreamingDataType.NEW_BLOCKS;
  const duration = parseInt(searchParams.get('duration') || '30000');
  const expectedRate = parseInt(searchParams.get('expectedRate') || '10');

  try {
    console.log(`Starting streaming benchmark: ${streamType} on ${network} for ${duration}ms`);

    const benchmarkParams: StreamingBenchmarkParams = {
      network,
      streamType: streamType as StreamingDataType,
      duration,
      expectedMessageRate: expectedRate
    };

    const benchmarkPromises = providerMetadata.map(async (provider) => {
      try {
        console.log(`Benchmarking ${provider.name}...`);
        const result = await provider.adapter.benchmarkStream(benchmarkParams);
        return result;
      } catch (error) {
        console.error(`Error benchmarking ${provider.name}:`, error);
        return {
          provider: {
            id: provider.id,
            name: provider.name,
            type: provider.type,
            logo: provider.logo,
            color: provider.color,
            hasStreaming: provider.hasStreaming,
            endpoint: provider.endpoint,
            protocol: provider.protocol,
            description: provider.description
          },
          status: 'error' as const,
          metrics: {
            connection_latency: 0,
            first_data_latency: 0,
            throughput: 0,
            message_count: 0,
            connection_drops: 0,
            reconnection_count: 0,
            data_completeness: 0,
            uptime_percent: 0,
            average_message_size: 0,
            error_rate: 100
          },
          testDuration: duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(benchmarkPromises);
    const stats = calculateStreamingStats(results.filter(r => r.status === 'success'));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      testParams: {
        network,
        streamType,
        duration,
        expectedMessageRate: expectedRate
      },
      results,
      stats,
      summary: {
        totalProviders: results.length,
        successfulTests: results.filter(r => r.status === 'success').length,
        fastestProvider: stats.fastestProvider,
        mostReliable: stats.mostReliableProvider,
        highestThroughput: stats.highestThroughputProvider
      }
    });

  } catch (error) {
    console.error('Streaming benchmark failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function calculateStreamingStats(successResults: StreamingBenchmarkResult[]) {
  if (successResults.length === 0) {
    return {
      fastestProvider: null,
      mostReliableProvider: null,
      highestThroughputProvider: null,
      averageLatency: 0,
      averageThroughput: 0,
      averageUptime: 0
    };
  }

  const fastestProvider = successResults.reduce((fastest, current) =>
    current.metrics.connection_latency < fastest.metrics.connection_latency ? current : fastest
  );

  const mostReliableProvider = successResults.reduce((reliable, current) => {
    const currentReliability = current.metrics.uptime_percent - current.metrics.error_rate;
    const reliableReliability = reliable.metrics.uptime_percent - reliable.metrics.error_rate;
    return currentReliability > reliableReliability ? current : reliable;
  });

  const highestThroughputProvider = successResults.reduce((highest, current) =>
    current.metrics.throughput > highest.metrics.throughput ? current : highest
  );

  const totalResults = successResults.length;
  const averageLatency = successResults.reduce((sum, r) => sum + r.metrics.connection_latency, 0) / totalResults;
  const averageThroughput = successResults.reduce((sum, r) => sum + r.metrics.throughput, 0) / totalResults;
  const averageUptime = successResults.reduce((sum, r) => sum + r.metrics.uptime_percent, 0) / totalResults;

  return {
    fastestProvider: {
      name: fastestProvider.provider.name,
      latency: fastestProvider.metrics.connection_latency
    },
    mostReliableProvider: {
      name: mostReliableProvider.provider.name,
      uptime: mostReliableProvider.metrics.uptime_percent,
      errorRate: mostReliableProvider.metrics.error_rate
    },
    highestThroughputProvider: {
      name: highestThroughputProvider.provider.name,
      throughput: highestThroughputProvider.metrics.throughput
    },
    averageLatency: Math.round(averageLatency),
    averageThroughput: Math.round(averageThroughput * 100) / 100,
    averageUptime: Math.round(averageUptime * 100) / 100
  };
}
