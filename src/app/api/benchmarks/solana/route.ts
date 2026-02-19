import { NextResponse } from 'next/server';
import { SolanaGoldRushAdapter } from '@/lib/adapters/solana-goldrush';
import { SolanaBirdeyeAdapter } from '@/lib/adapters/solana-birdeye';
import { SolanaMobulaAdapter } from '@/lib/adapters/solana-mobula';
import { SolanaLaserTeamAdapter } from '@/lib/adapters/solana-laserteam';
import { SolanaAlchemyAdapter } from '@/lib/adapters/solana-alchemy';

function jsonWithCache(data: unknown, maxAge: number = 300) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      'CDN-Cache-Control': `public, s-maxage=${maxAge}`,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${maxAge}`,
    },
  });
}

// Composite score: Latency 35% + Uptime 35% + Throughput 30%
function computeScore(
  latency_p50: number,
  uptime_percent: number,
  throughput_rps: number
): number {
  const maxLatency = 500;
  const latencyScore = Math.max(0, 100 - (latency_p50 / maxLatency) * 100);

  const uptimeScore = uptime_percent;

  const maxThroughput = 300;
  const throughputScore = Math.min(100, (throughput_rps / maxThroughput) * 100);

  return Number((latencyScore * 0.35 + uptimeScore * 0.35 + throughputScore * 0.30).toFixed(1));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const run = searchParams.get('run') === 'true';
  const providerSlug = searchParams.get('provider');

  const adapters = [
    new SolanaGoldRushAdapter(),
    new SolanaAlchemyAdapter(),
    new SolanaBirdeyeAdapter(),
    new SolanaMobulaAdapter(),
    new SolanaLaserTeamAdapter(),
  ];

  // Single provider detail
  if (providerSlug) {
    const adapter = adapters.find(a => a.id === providerSlug);
    if (!adapter) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    const metrics = await (adapter as any).measureWithThroughput();
    const metadata = adapter.getMetadata();
    return jsonWithCache({
      provider: {
        ...metadata,
        is_us: (adapter as any).isUs ?? false,
        metrics,
        score: computeScore(metrics.latency_p50, metrics.uptime_percent, metrics.throughput_rps)
      },
      last_updated: new Date().toISOString()
    }, 120);
  }

  // Run all providers in parallel
  const results = await Promise.allSettled(
    adapters.map(async (adapter) => {
      const [metrics, metadata] = await Promise.all([
        (adapter as any).measureWithThroughput(),
        Promise.resolve(adapter.getMetadata())
      ]);
      const score = computeScore(metrics.latency_p50, metrics.uptime_percent, metrics.throughput_rps);
      return {
        ...metadata,
        is_us: (adapter as any).isUs ?? false,
        metrics,
        score,
        is_mock: metrics.is_mock ?? false
      };
    })
  );

  const providers = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason?.message || 'Unknown error');

  // Summary stats
  const fastest = [...providers].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50)[0];
  const highestUptime = [...providers].sort((a, b) => b.metrics.uptime_percent - a.metrics.uptime_percent)[0];
  const highestThroughput = [...providers].sort((a, b) => b.metrics.throughput_rps - a.metrics.throughput_rps)[0];
  const winner = providers[0];
  const usProvider = providers.find(p => p.is_us);

  return jsonWithCache({
    providers,
    stats: {
      fastest: fastest ? { name: fastest.name, latency_p50: fastest.metrics.latency_p50 } : null,
      highest_uptime: highestUptime ? { name: highestUptime.name, uptime: highestUptime.metrics.uptime_percent } : null,
      highest_throughput: highestThroughput ? { name: highestThroughput.name, throughput_rps: highestThroughput.metrics.throughput_rps } : null,
      winner: winner ? { name: winner.name, score: winner.score } : null,
      us_rank: usProvider?.rank ?? null,
    },
    meta: {
      total_providers: providers.length,
      errors: errors.length > 0 ? errors : undefined,
      forced_run: run,
    },
    last_updated: new Date().toISOString(),
  }, 300);
}
