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

    // For meaningful charts, we need history. But since we cannot mock data, 
    // and we don't have a persistent database in this backendless setup,
    // we will return the single current real-time data point.
    const data = [
      {
        timestamp: new Date().toISOString(),
        value: provider.current_metrics.latency_p50
      }
    ];

    return NextResponse.json({
      data,
      metric: 'latency_p50',
      unit: 'ms',
      timeframe: 'real-time',
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
      final_score: provA.scores.final_score - provB.scores.final_score,
      winner:
        provA.scores.final_score > provB.scores.final_score
          ? 'provider_a'
          : provA.scores.final_score < provB.scores.final_score
            ? 'provider_b'
            : 'tie'
    };

    return NextResponse.json({ provider_a: provA, provider_b: provB, deltas });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
