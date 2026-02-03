const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/provider/:slug
 *
 * Returns full provider details
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

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

    if (!provider) {
      return res.status(404).json({
        error: 'Provider not found',
        slug
      });
    }

    // Parse JSON fields
    const supported_chains = JSON.parse(provider.supported_chains || '[]');
    const pricing = JSON.parse(provider.pricing_info || '{}');
    const capabilities = JSON.parse(provider.capabilities || '{}');

    // Set cache headers (2 minutes)
    res.set('Cache-Control', 'public, max-age=120');

    res.json({
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        logo_url: provider.logo_url,
        website_url: provider.website_url,
        supported_chains,
        pricing,
        capabilities,
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
      },
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Provider detail error:', error);
    res.status(500).json({
      error: 'Failed to fetch provider details',
      message: error.message
    });
  }
});

module.exports = router;
