const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/compare
 *
 * Side-by-side provider comparison
 */
router.get('/', async (req, res) => {
  try {
    const { a, b } = req.query;

    if (!a || !b) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['a', 'b']
      });
    }

    // Fetch both providers
    const [providerA, providerB] = await Promise.all([
      getProviderData(a),
      getProviderData(b)
    ]);

    if (!providerA || !providerB) {
      return res.status(404).json({
        error: 'One or both providers not found',
        provider_a: providerA ? 'found' : 'not found',
        provider_b: providerB ? 'found' : 'not found'
      });
    }

    // Calculate deltas
    const deltas = {
      latency_p50:
        providerA.current_metrics.latency_p50 -
        providerB.current_metrics.latency_p50,
      latency_p95:
        providerA.current_metrics.latency_p95 -
        providerB.current_metrics.latency_p95,
      uptime_percent:
        providerA.current_metrics.uptime_percent -
        providerB.current_metrics.uptime_percent,
      final_score: providerA.scores.final_score - providerB.scores.final_score,
      winner: null
    };

    // Determine winner (higher final score wins)
    deltas.winner =
      deltas.final_score > 0
        ? 'provider_a'
        : deltas.final_score < 0
          ? 'provider_b'
          : 'tie';

    // Set cache headers (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');

    res.json({
      provider_a: providerA,
      provider_b: providerB,
      deltas
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      error: 'Failed to compare providers',
      message: error.message
    });
  }
});

/**
 * Helper: Get full provider data (reuses provider route logic)
 */
async function getProviderData(slug) {
  const provider = await db.queryOne(
    `
    SELECT 
      p.*,
      m.latency_p50, m.latency_p95, m.latency_p99,
      m.uptime_percent, m.error_rate,
      m.final_score, m.latency_score, m.reliability_score,
      m.coverage_score, m.dx_score, m.pricing_score,
      m.rank, m.trend
    FROM providers p
    LEFT JOIN current_metrics m ON p.id = m.provider_id
    WHERE p.slug = ?
  `,
    [slug]
  );

  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    logo_url: provider.logo_url,
    website_url: provider.website_url,
    supported_chains: JSON.parse(provider.supported_chains || '[]'),
    pricing: JSON.parse(provider.pricing_info || '{}'),
    capabilities: JSON.parse(provider.capabilities || '{}'),
    current_metrics: {
      latency_p50: provider.latency_p50,
      latency_p95: provider.latency_p95,
      latency_p99: provider.latency_p99,
      uptime_percent: provider.uptime_percent,
      error_rate: provider.error_rate
    },
    scores: {
      final_score: provider.final_score,
      latency_score: provider.latency_score,
      reliability_score: provider.reliability_score,
      coverage_score: provider.coverage_score,
      dx_score: provider.dx_score,
      pricing_score: provider.pricing_score
    },
    rank: provider.rank,
    trend: provider.trend || 'stable'
  };
}

module.exports = router;
