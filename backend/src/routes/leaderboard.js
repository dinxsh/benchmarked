const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/leaderboard
 *
 * Returns ranked list of all providers
 */
router.get('/', async (req, res) => {
  try {
    const { chain, sort } = req.query;

    // Build SQL query
    let sql = `
      SELECT 
        p.id, p.name, p.slug, p.logo_url,
        p.supported_chains,
        m.final_score, m.latency_p50, m.uptime_percent, 
        m.rank, m.trend
      FROM providers p
      INNER JOIN current_metrics m ON p.id = m.provider_id
    `;

    const params = [];

    // Chain filter
    if (chain) {
      sql += ` WHERE p.supported_chains LIKE ?`;
      params.push(`%"${chain}"%`);
    }

    // Sorting
    const sortField = sort === 'latency' ? 'm.latency_p50 ASC' : 'm.rank ASC';
    sql += ` ORDER BY ${sortField}`;

    const providers = await db.query(sql, params);

    // Transform data to match frontend contract
    const data = providers.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      logo_url: p.logo_url,
      final_score: p.final_score,
      latency_p50: p.latency_p50,
      uptime_percent: p.uptime_percent,
      supported_chains: JSON.parse(p.supported_chains),
      rank: p.rank,
      trend: p.trend || 'stable',
      health_status: getHealthStatus(p.uptime_percent)
    }));

    // Set cache headers (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');

    res.json({
      data,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

/**
 * Helper: Determine health status based on uptime
 */
function getHealthStatus(uptime) {
  if (uptime >= 99.9) return 'healthy';
  if (uptime >= 99.0) return 'degraded';
  return 'unstable';
}

module.exports = router;
