import { NextResponse } from 'next/server';
import { benchmarkStore } from '@/lib/benchmark-store';

// Helper to add cache headers
function jsonWithCache(data: any, maxAge: number = 300) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      'CDN-Cache-Control': `public, s-maxage=${maxAge}`,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${maxAge}`,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'leaderboard';

  if (type === 'leaderboard') {
    const chain = searchParams.get('chain') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const data = await benchmarkStore.getLeaderboard(chain, sort);
    // Cache for 5 minutes, allow stale for 10 minutes
    return jsonWithCache({ data, last_updated: new Date().toISOString() }, 300);
  }

  if (type === 'provider') {
    const slug = searchParams.get('slug');
    if (!slug)
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });

    const provider = await benchmarkStore.getProvider(slug);
    if (!provider)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Cache for 2 minutes
    return jsonWithCache({
      provider,
      last_updated: new Date().toISOString()
    }, 120);
  }

  if (type === 'metrics') {
    // For backendless demo, we generate synthetic history based on current metrics
    const providerSlug = searchParams.get('provider');
    if (!providerSlug)
      return NextResponse.json({ error: 'Provider required' }, { status: 400 });

    const provider = await benchmarkStore.getProvider(providerSlug);
    if (!provider)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Use real history from DB if available.
    // Strictly NO MOCKS as requested.
    const data = provider.metrics_history && provider.metrics_history.length > 0
      ? provider.metrics_history
      : [];

    // Cache for 5 minutes
    return jsonWithCache({
      data,
      metric: 'latency_p50',
      unit: 'ms',
      timeframe: '24h',
      provider: providerSlug
    }, 300);
  }

  if (type === 'compare') {
    const a = searchParams.get('a');
    const b = searchParams.get('b');
    if (!a || !b)
      return NextResponse.json({ error: 'a and b required' }, { status: 400 });

    const [provA, provB] = await Promise.all([
      benchmarkStore.getProvider(a),
      benchmarkStore.getProvider(b)
    ]);

    if (!provA || !provB)
      return NextResponse.json(
        { error: 'One or both providers not found' },
        { status: 404 }
      );

    const deltas = {
      latency_p50:
        provA.current_metrics.latency_p50 - provB.current_metrics.latency_p50,
      uptime_percent:
        provA.current_metrics.uptime_percent -
        provB.current_metrics.uptime_percent,
      final_score: provA.scores.final_score - provB.scores.final_score,
      winner:
        provA.scores.final_score > provB.scores.final_score
          ? 'provider_a'
          : provA.scores.final_score < provB.scores.final_score
            ? 'provider_b'
            : 'tie'
    };

    // Cache for 5 minutes
    return jsonWithCache({ provider_a: provA, provider_b: provB, deltas }, 300);
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
