import { Provider, ProviderMetrics, ProviderScores } from './benchmark-types';
import * as adapters from './adapters';

class BenchmarkStore {
  private cache: Provider[] = [];
  private lastUpdated: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private isUpdating = false;

  async getLeaderboard(chain?: string, sort?: string): Promise<Provider[]> {
    await this.ensureData();

    let data = [...this.cache];

    if (chain) {
      data = data.filter((p) => p.supported_chains.includes(chain));
    }

    if (sort === 'latency') {
      data.sort(
        (a, b) => a.current_metrics.latency_p50 - b.current_metrics.latency_p50
      );
    } else {
      data.sort((a, b) => a.rank - b.rank);
    }

    return data;
  }

  async getProvider(slug: string): Promise<Provider | undefined> {
    await this.ensureData();
    return this.cache.find((p) => p.slug === slug);
  }

  // Used for metrics history - separate from main cache in full version,
  // but for backendless demo we might just generate synthetic history or store it roughly.
  // For now, we will just return the current metrics as the "latest" point.

  private async ensureData() {
    // If cache is valid, return
    if (
      this.cache.length > 0 &&
      Date.now() - this.lastUpdated < this.CACHE_TTL
    ) {
      return;
    }

    // If already updating, wait for it (simple mutex)
    if (this.isUpdating) {
      // Just return stale data while updating if available
      if (this.cache.length > 0) return;
      // Otherwise wait a bit (rudimentary)
      await new Promise((r) => setTimeout(r, 1000));
      return;
    }

    try {
      this.isUpdating = true;
      console.log('Refreshing benchmark data...');

      const newCache: Provider[] = [];
      const adapterList = Object.values(adapters).map(
        (AdapterClass) => new AdapterClass()
      );

      // Run measurements in parallel
      const resultsSettled = await Promise.allSettled(
        adapterList.map(async (adapter) => {
          const metrics = await adapter.measure();
          return { adapter, metrics };
        })
      );

      const results = resultsSettled
        .filter(
          (
            r
          ): r is {
            status: 'fulfilled';
            value: { adapter: any; metrics: ProviderMetrics };
          } => r.status === 'fulfilled'
        )
        .map((r) => r.value);

      // Log failures
      resultsSettled.forEach((r) => {
        if (r.status === 'rejected') {
          console.error('Adapter implementation failed:', r.reason);
        }
      });

      // Calculate scores and ranks
      const intermediate = results.map(({ adapter, metrics }) => {
        const metadata = adapter.getMetadata();
        const scores = this.calculateScores(
          metrics,
          metadata.pricing,
          metadata.capabilities
        );
        return { metadata, metrics, scores };
      });

      // Sort by final score to determine rank
      intermediate.sort((a, b) => b.scores.final_score - a.scores.final_score);

      // Map to final Provider object
      intermediate.forEach((item, index) => {
        const provider: Provider = {
          ...item.metadata,
          current_metrics: item.metrics,
          scores: item.scores,
          rank: index + 1,
          trend: Math.random() > 0.5 ? 'up' : 'stable', // Synthetic trend for demo
          health_status:
            item.metrics.uptime_percent > 98 ? 'healthy' : 'degraded'
        };
        newCache.push(provider);
      });

      this.cache = newCache;
      this.lastUpdated = Date.now();
    } catch (e) {
      console.error('Failed to update benchmarks:', e);
    } finally {
      this.isUpdating = false;
    }
  }

  private calculateScores(
    metrics: ProviderMetrics,
    pricing: any,
    capabilities: any
  ): ProviderScores {
    // 1. Latency Score (0-40) - Lower is better. <50ms = 40, >500ms = 0
    const latScore = Math.max(0, 40 * (1 - metrics.latency_p50 / 500));

    // 2. Reliability Score (0-30) - Higher is better
    const relScore = Math.max(0, 30 * (metrics.uptime_percent / 100));

    // 3. Coverage (0-20)
    let capScore = 10; // Base
    if (capabilities.historical_depth === 'full') capScore += 5;
    if (capabilities.traces) capScore += 5;

    // 4. Pricing & DX (0-10)
    let priceScore = 5;
    if (pricing.cost_per_million < 1.0) priceScore += 5;

    const final = latScore + relScore + capScore + priceScore;

    return {
      final_score: Number(final.toFixed(1)),
      latency_score: Number(latScore.toFixed(1)),
      reliability_score: Number(relScore.toFixed(1)),
      coverage_score: Number(capScore.toFixed(1)),
      dx_score: 5, // Placeholder
      pricing_score: Number(priceScore.toFixed(1))
    };
  }
}

// Singleton export
export const benchmarkStore = new BenchmarkStore();
