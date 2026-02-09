// benchmark-store.ts - Refactored to use in-memory cache instead of MongoDB

import { benchmarkCache, StreamingBenchmarkData } from './benchmark-cache';
import { Provider, StreamingMetrics } from './benchmark-types';

class BenchmarkStore {
  /**
   * Get leaderboard (sorted list of providers)
   */
  async getLeaderboard(chain?: string, sort?: string): Promise<Provider[]> {
    const sortBy = this.mapSortParameter(sort);
    const leaderboard = benchmarkCache.getLeaderboard(sortBy);

    // Transform to Provider format
    let data: Provider[] = leaderboard.map((cacheData, index) =>
      this.transformToProvider(cacheData, index + 1)
    );

    // Filter by chain if specified (currently not implemented in cache data)
    if (chain) {
      data = data.filter((p) =>
        p.supported_chains?.includes(chain)
      );
    }

    // Custom sort if requested (beyond the default cache sort)
    if (sort === 'slowest') {
      data.sort(
        (a, b) =>
          b.current_metrics.latency_p50 - a.current_metrics.latency_p50
      );
    } else if (sort === 'response_size' || sort === 'smallest') {
      data.sort(
        (a, b) =>
          (a.current_metrics.response_size_bytes || 0) -
          (b.current_metrics.response_size_bytes || 0)
      );
    } else if (sort === 'biggest') {
      data.sort(
        (a, b) =>
          (b.current_metrics.response_size_bytes || 0) -
          (a.current_metrics.response_size_bytes || 0)
      );
    }

    // Re-assign ranks after custom sorting
    data.forEach((p, i) => {
      p.rank = i + 1;
    });

    return data;
  }

  /**
   * Get specific provider by slug
   */
  async getProvider(slug: string): Promise<Provider | undefined> {
    const data = benchmarkCache.get(slug);

    if (!data) {
      return undefined;
    }

    // Get rank by comparing with all providers
    const allProviders = benchmarkCache.getAll();
    const sorted = allProviders.sort(
      (a, b) => a.metrics.connection_latency - b.metrics.connection_latency
    );
    const rank = sorted.findIndex((p) => p.providerId === slug) + 1;

    return this.transformToProvider(data, rank);
  }

  /**
   * Update provider benchmark data in cache
   */
  async updateProvider(
    slug: string,
    metrics: StreamingMetrics,
    metadata?: any
  ): Promise<void> {
    benchmarkCache.set(slug, {
      providerId: slug,
      name: metadata?.name || slug,
      metrics
    });
  }

  /**
   * Get metrics history for provider
   */
  async getMetricsHistory(
    slug: string
  ): Promise<Array<{ timestamp: Date | string; value: number }>> {
    const history = benchmarkCache.getHistory(slug);

    return history.map((point) => ({
      timestamp: new Date(point.timestamp),
      value: point.metrics.connection_latency // Primary metric
    }));
  }

  /**
   * Map sort parameter to cache sort type
   */
  private mapSortParameter(
    sort?: string
  ): 'latency' | 'throughput' | 'uptime' {
    switch (sort) {
      case 'throughput':
        return 'throughput';
      case 'uptime':
      case 'reliability':
        return 'uptime';
      case 'latency':
      case 'fastest':
      default:
        return 'latency';
    }
  }

  /**
   * Transform cache data to Provider interface
   * NOTE: Removes synthetic scores, keeps only real metrics
   */
  private transformToProvider(
    data: StreamingBenchmarkData,
    rank: number
  ): Provider {
    return {
      id: data.providerId,
      name: data.name,
      slug: data.providerId,
      logo_url: `/providers/${data.providerId}.svg`,
      website_url: `https://${data.providerId.replace('-streaming', '').replace('-ws', '')}.com`,
      supported_chains: ['ethereum'], // Could be extended from metadata
      pricing: {
        cost_per_million: 0, // Could be fetched from metadata
        rate_limit: 'N/A'
      },
      capabilities: {
        transactions: true,
        logs: true,
        token_balances: false,
        nft_metadata: false,
        historical_depth: 'N/A',
        custom_indexing: false
      },
      current_metrics: {
        latency_p50:
          data.metrics.message_latency_p50 ||
          data.metrics.connection_latency,
        latency_p95: data.metrics.message_latency_p95 || 0,
        latency_p99: data.metrics.message_latency_p99 || 0,
        uptime_percent: data.metrics.uptime_percent,
        error_rate: data.metrics.error_rate,
        response_size_bytes: data.metrics.average_message_size
      },
      scores: {
        // Remove synthetic scores - use direct metrics instead
        final_score: 0,
        latency_score: 0,
        reliability_score: 0,
        coverage_score: 0,
        dx_score: 0,
        pricing_score: 0
      },
      rank,
      trend: this.calculateTrend(data.history),
      health_status: this.determineHealthStatus(data.metrics),
      metrics_history: data.history.map((h) => ({
        timestamp: new Date(h.timestamp),
        value: h.metrics.connection_latency
      }))
    };
  }

  /**
   * Calculate trend from history data
   */
  private calculateTrend(
    history: Array<{ timestamp: number; metrics: StreamingMetrics }>
  ): 'up' | 'down' | 'stable' {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-3);
    const avgRecent =
      recent.reduce((sum, h) => sum + h.metrics.connection_latency, 0) /
      recent.length;
    const older = history.slice(-6, -3);

    if (older.length === 0) return 'stable';

    const avgOlder =
      older.reduce((sum, h) => sum + h.metrics.connection_latency, 0) /
      older.length;

    // Lower latency = better = "up" trend
    if (avgRecent < avgOlder * 0.9) return 'up';
    if (avgRecent > avgOlder * 1.1) return 'down';
    return 'stable';
  }

  /**
   * Determine health status from metrics
   */
  private determineHealthStatus(
    metrics: StreamingMetrics
  ): 'healthy' | 'degraded' | 'unstable' {
    const { uptime_percent, error_rate, connection_drops } = metrics;

    if (
      uptime_percent >= 99 &&
      error_rate < 1 &&
      connection_drops === 0
    ) {
      return 'healthy';
    }

    if (
      uptime_percent >= 95 &&
      error_rate < 5 &&
      connection_drops <= 2
    ) {
      return 'degraded';
    }

    return 'unstable';
  }
}

export const benchmarkStore = new BenchmarkStore();
