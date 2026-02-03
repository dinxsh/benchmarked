const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/metrics/:provider
 *
 * Returns time-series data for charts
 */
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { metric = 'latency_p50', timeframe = '24h', chain } = req.query;

    // Validate metric
    const validMetrics = [
      'latency_p50',
      'latency_p95',
      'latency_p99',
      'uptime_percent'
    ];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        error: 'Invalid metric',
        valid_metrics: validMetrics
      });
    }

    // Calculate time window
    const hours = timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 24;

    // Build query
    let sql = `
      SELECT 
        timestamp,
        ${metric} as value
      FROM metrics_history
      WHERE provider_id = ?
        AND timestamp > datetime('now', '-${hours} hours')
    `;

    const params = [provider];

    if (chain) {
      sql += ` AND chain = ?`;
      params.push(chain);
    }

    sql += ` ORDER BY timestamp ASC`;

    const history = await db.query(sql, params);

    // Format timestamps
    const data = history.map((row) => ({
      timestamp: new Date(row.timestamp).toISOString(),
      value: row.value
    }));

    // Set cache headers (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');

    res.json({
      data,
      metric,
      unit: metric.includes('latency') ? 'ms' : '%',
      timeframe,
      provider
    });
  } catch (error) {
    console.error('Metrics history error:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

module.exports = router;
