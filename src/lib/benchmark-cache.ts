// benchmark-cache.ts - In-memory cache replacement for MongoDB

import { StreamingMetrics } from './benchmark-types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface StreamingBenchmarkData {
  providerId: string;
  name: string;
  metrics: StreamingMetrics;
  history: Array<{ timestamp: number; metrics: StreamingMetrics }>;
  lastUpdated: number;
}

class BenchmarkCache {
  private cache: Map<string, CacheEntry<StreamingBenchmarkData>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_HISTORY_POINTS = 24; // Keep last 24 data points
  private cleanupInterval: NodeJS.Timeout;
  private updateLock: Map<string, Promise<void>> = new Map();

  constructor() {
    // Auto-cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Set benchmark data with history tracking
   */
  set(
    providerId: string,
    data: Omit<StreamingBenchmarkData, 'history' | 'lastUpdated'>,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const existing = this.cache.get(providerId);
    const now = Date.now();

    // Preserve history and add new data point
    const history = existing?.data.history || [];
    const newHistoryPoint = {
      timestamp: now,
      metrics: data.metrics
    };

    // Keep only last MAX_HISTORY_POINTS
    const updatedHistory = [...history, newHistoryPoint].slice(
      -this.MAX_HISTORY_POINTS
    );

    const cacheEntry: CacheEntry<StreamingBenchmarkData> = {
      data: {
        ...data,
        history: updatedHistory,
        lastUpdated: now
      },
      timestamp: now,
      expiresAt: now + ttl
    };

    this.cache.set(providerId, cacheEntry);
  }

  /**
   * Atomic set operation with lock mechanism
   */
  async setAtomic(
    providerId: string,
    data: Omit<StreamingBenchmarkData, 'history' | 'lastUpdated'>
  ): Promise<void> {
    // Wait for any pending update to complete
    const existingLock = this.updateLock.get(providerId);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock
    const lockPromise = (async () => {
      this.set(providerId, data);
    })();

    this.updateLock.set(providerId, lockPromise);

    try {
      await lockPromise;
    } finally {
      this.updateLock.delete(providerId);
    }
  }

  /**
   * Get benchmark data by provider ID
   */
  get(providerId: string): StreamingBenchmarkData | null {
    const entry = this.cache.get(providerId);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(providerId);
      return null;
    }

    return entry.data;
  }

  /**
   * Get all non-expired providers
   */
  getAll(): StreamingBenchmarkData[] {
    const now = Date.now();
    const results: StreamingBenchmarkData[] = [];

    // Convert iterator to array to avoid downlevelIteration requirement
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now <= entry.expiresAt) {
        results.push(entry.data);
      } else {
        this.cache.delete(key);
      }
    });

    return results;
  }

  /**
   * Get sorted leaderboard
   */
  getLeaderboard(
    sortBy: 'latency' | 'throughput' | 'uptime' = 'latency'
  ): StreamingBenchmarkData[] {
    const all = this.getAll();

    return all.sort((a, b) => {
      switch (sortBy) {
        case 'latency':
          return a.metrics.connection_latency - b.metrics.connection_latency;
        case 'throughput':
          return b.metrics.throughput - a.metrics.throughput;
        case 'uptime':
          return b.metrics.uptime_percent - a.metrics.uptime_percent;
        default:
          return 0;
      }
    });
  }

  /**
   * Get metrics history for specific provider
   */
  getHistory(
    providerId: string
  ): Array<{ timestamp: number; metrics: StreamingMetrics }> {
    const entry = this.cache.get(providerId);
    return entry?.data.history || [];
  }

  /**
   * Check if provider exists in cache
   */
  has(providerId: string): boolean {
    const entry = this.cache.get(providerId);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(providerId);
      return false;
    }

    return true;
  }

  /**
   * Delete specific provider
   */
  delete(providerId: string): boolean {
    return this.cache.delete(providerId);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Convert iterator to array to avoid downlevelIteration requirement
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`[BenchmarkCache] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    totalEntries: number;
    expiredEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const now = Date.now();
    let expiredCount = 0;
    let oldest: number | null = null;
    let newest: number | null = null;

    // Convert iterator to array to avoid downlevelIteration requirement
    Array.from(this.cache.values()).forEach((entry) => {
      if (now > entry.expiresAt) {
        expiredCount++;
      } else {
        if (oldest === null || entry.timestamp < oldest) {
          oldest = entry.timestamp;
        }
        if (newest === null || entry.timestamp > newest) {
          newest = entry.timestamp;
        }
      }
    });

    return {
      size: this.cache.size,
      totalEntries: this.cache.size - expiredCount,
      expiredEntries: expiredCount,
      oldestEntry: oldest,
      newestEntry: newest
    };
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Singleton instance
export const benchmarkCache = new BenchmarkCache();

// For Next.js hot reload cleanup
if (process.env.NODE_ENV === 'development') {
  if ((global as any).benchmarkCache) {
    (global as any).benchmarkCache.destroy();
  }
  (global as any).benchmarkCache = benchmarkCache;
}
