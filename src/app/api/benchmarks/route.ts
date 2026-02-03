import { NextResponse } from 'next/server';
import { benchmarkStore } from '@/lib/benchmark-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'leaderboard';

  if (type === 'leaderboard') {
    const chain = searchParams.get('chain') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const data = await benchmarkStore.getLeaderboard(chain, sort);
    return NextResponse.json({ data, last_updated: new Date().toISOString() });
  }

  if (type === 'provider') {
    const slug = searchParams.get('slug');
    if (!slug)
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });

    const provider = await benchmarkStore.getProvider(slug);
    if (!provider)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      provider,
      last_updated: new Date().toISOString()
    });
  }

  if (type === 'metrics') {
    // For backendless demo, we generate synthetic history based on current metrics
    const providerSlug = searchParams.get('provider');
    if (!providerSlug)
      return NextResponse.json({ error: 'Provider required' }, { status: 400 });

    const provider = await benchmarkStore.getProvider(providerSlug);
    if (!provider)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Generate 24h history
    const data = [];
    const now = Date.now();
    const baseLat = provider.current_metrics.latency_p50;

    for (let i = 24; i >= 0; i--) {
      data.push({
        timestamp: new Date(now - i * 3600 * 1000).toISOString(),
        value: Math.max(20, baseLat + (Math.random() * 40 - 20)) // +/- 20ms variance
      });
    }

    return NextResponse.json({
      data,
      metric: 'latency_p50',
      unit: 'ms',
      timeframe: '24h',
      provider: providerSlug
    });
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
      final_score: provA.scores.final_score - provB.scores.final_score
    };

    return NextResponse.json({ provider_a: provA, provider_b: provB, deltas });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
