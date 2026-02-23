import { NextResponse } from 'next/server';
import { SolanaGoldRushAdapter } from '@/lib/adapters/solana-goldrush';
import { SolanaAlchemyAdapter } from '@/lib/adapters/solana-alchemy';
import { SolanaAnkrAdapter } from '@/lib/adapters/solana-ankr';
import { SolanaQuickNodeAdapter } from '@/lib/adapters/solana-quicknode';
import { SolanaLaserStreamAdapter } from '@/lib/adapters/solana-laserteam';
import { SolanaBirdeyeAdapter } from '@/lib/adapters/solana-birdeye';
import { SolanaMobulaAdapter } from '@/lib/adapters/solana-mobula';

export const dynamic = 'force-dynamic';

function jsonNoCache(data: unknown) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

// Composite score: Latency 40% + Reliability 35% + Throughput 25%
//
// Latency:    100 - (p50 / 2000) * 100  → full marks at 0ms, 0 at ≥2000ms
//             Capped at 2000ms so even slow REST providers get a non-zero score.
// Reliability: success_rate from the measurement window (0–100%).
//             With sampleSize=5: resolution is 0/20/40/60/80/100.
//             Providers where ALL requests fail are excluded by Promise.allSettled.
// Throughput: min(100, (rps / 200) * 100) — cap at 200 rps for fair cross-type scoring.
//             JSON-RPC naturally achieves higher RPS; REST/Data APIs cap lower.
//             200 rps reflects a realistic high-performance threshold for all types.
function computeScore(
  latency_p50: number,
  uptime_percent: number,
  throughput_rps: number
): number {
  const maxLatency    = 2000;  // ms ceiling — anything ≥2s scores 0 on latency
  const maxThroughput = 200;   // rps ceiling — fair across RPC and REST/Data types

  const latencyScore    = Math.max(0, 100 - (latency_p50 / maxLatency) * 100);
  const reliabilityScore = uptime_percent;                                      // 0–100
  const throughputScore  = Math.min(100, (throughput_rps / maxThroughput) * 100);

  return Number(
    (latencyScore * 0.40 + reliabilityScore * 0.35 + throughputScore * 0.25).toFixed(1)
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const run = searchParams.get('run') === 'true';
  const providerSlug = searchParams.get('provider');

  const adapters = [
    new SolanaGoldRushAdapter(),
    new SolanaAlchemyAdapter(),
    new SolanaAnkrAdapter(),
    new SolanaQuickNodeAdapter(),
    new SolanaLaserStreamAdapter(),
    new SolanaBirdeyeAdapter(),
    new SolanaMobulaAdapter(),
  ];

  // Single provider detail
  if (providerSlug) {
    const adapter = adapters.find(a => a.id === providerSlug);
    if (!adapter) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    const metrics = await (adapter as any).measureWithThroughput();
    const metadata = adapter.getMetadata();
    return jsonNoCache({
      provider: {
        ...metadata,
        is_us: (adapter as any).isUs ?? false,
        metrics,
        score: computeScore(metrics.latency_p50, metrics.uptime_percent, metrics.throughput_rps)
      },
      last_updated: new Date().toISOString()
    });
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
        metrics: {
          latency_p50: metrics.latency_p50,
          latency_p95: metrics.latency_p95,
          latency_p99: metrics.latency_p99,
          uptime_percent: metrics.uptime_percent,
          error_rate: metrics.error_rate ?? 0,
          throughput_rps: metrics.throughput_rps,
          slot_height: metrics.slot_height ?? 0,
        },
        score,
        is_mock: metrics.is_mock ?? false,
        measured_at: new Date().toISOString(),
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

  return jsonNoCache({
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
  });
}
