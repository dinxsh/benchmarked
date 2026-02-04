import dbConnect from './db';
import Benchmark, { IBenchmark } from '@/models/Benchmark';
import { Provider } from './benchmark-types';

class BenchmarkStore {
  // Simple in-memory cache to prevent hitting Mongo on literally every request if high traffic
  // But much lighter than before.
  // In a real serverless setup, this cache is per-instance.

  async getLeaderboard(chain?: string, sort?: string): Promise<Provider[]> {
    await dbConnect();

    // Fetch all docs
    const docs = await Benchmark.find({}).lean().exec();

    // Transform to Provider interface
    let data: Provider[] = docs.map((doc: any, index: number) => ({
      id: doc.providerId,
      name: doc.name,
      slug: doc.slug,
      ...doc.metadata,
      current_metrics: doc.metrics,
      last_response_body: doc.details?.last_response_body,
      scores: doc.scores,
      rank: 0, // Will calc below
      trend: 'stable',
      health_status: doc.metrics.uptime_percent > 98 ? 'healthy' : 'degraded'
    }));

    // Filter
    if (chain) {
      data = data.filter((p) => p.supported_chains.includes(chain));
    }

    // Sort to determine rank
    data.sort((a, b) => b.scores.final_score - a.scores.final_score);

    // Assign Rank
    data.forEach((p, i) => { p.rank = i + 1; });

    // Custom Sort if requested
    if (sort === 'latency' || sort === 'fastest') {
      data.sort(
        (a, b) => a.current_metrics.latency_p50 - b.current_metrics.latency_p50
      );
    } else if (sort === 'slowest') {
      data.sort(
        (a, b) => b.current_metrics.latency_p50 - a.current_metrics.latency_p50
      );
    } else if (sort === 'response_size' || sort === 'smallest') {
      data.sort(
        (a, b) => (a.current_metrics.response_size_bytes || 0) - (b.current_metrics.response_size_bytes || 0)
      );
    } else if (sort === 'biggest') {
      data.sort(
        (a, b) => (b.current_metrics.response_size_bytes || 0) - (a.current_metrics.response_size_bytes || 0)
      );
    } else if (sort === 'uptime') {
      data.sort(
        (a, b) => b.current_metrics.uptime_percent - a.current_metrics.uptime_percent
      );
    }

    return data;
  }

  async getProvider(slug: string): Promise<Provider | undefined> {
    await dbConnect();
    const doc = await Benchmark.findOne({ slug }).lean().exec() as any;

    if (!doc) return undefined;

    return {
      id: doc.providerId,
      name: doc.name,
      slug: doc.slug,
      ...doc.metadata,
      current_metrics: doc.metrics,
      last_response_body: doc.details?.last_response_body,
      scores: doc.scores,
      rank: 0, // Best effort or need to fetch all to rank
      trend: 'stable',
      health_status: doc.metrics.uptime_percent > 98 ? 'healthy' : 'degraded',
      metrics_history: doc.metrics_history
    };
  }
}

export const benchmarkStore = new BenchmarkStore();
