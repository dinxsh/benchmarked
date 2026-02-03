const db = require('../db/client');
const providerAdapters = require('./providers');

/**
 * Main metric collection orchestrator
 * Called by cron every 5 minutes
 */
class MetricsCollector {
  constructor() {
    this.isCollecting = false;
  }

  /**
   * Collect metrics for all providers
   */
  async collectAll() {
    if (this.isCollecting) {
      console.log('⚠ Collection already in progress, skipping');
      return;
    }

    this.isCollecting = true;
    console.log('📊 Starting metrics collection...');

    try {
      // Get all providers
      const providers = await db.query('SELECT id FROM providers');

      // Collect metrics in parallel
      const results = await Promise.allSettled(
        providers.map((p) => this.collectForProvider(p.id))
      );

      // Log results
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      console.log(
        `✓ Collection complete: ${successful} succeeded, ${failed} failed`
      );

      // Recalculate scores after collection
      await require('./scorer').calculateAllScores();
    } catch (error) {
      console.error('❌ Collection failed:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * Collect metrics for a single provider
   */
  async collectForProvider(providerId) {
    const adapter = providerAdapters.get(providerId);

    if (!adapter) {
      console.warn(`⚠ No adapter found for ${providerId}`);
      return;
    }

    console.log(`  Collecting metrics for ${providerId}...`);

    try {
      // Run adapter's measurement logic
      const metrics = await adapter.measure();

      // Update current_metrics
      await db.run(
        `
        INSERT OR REPLACE INTO current_metrics 
        (provider_id, latency_p50, latency_p95, latency_p99, uptime_percent, error_rate, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
        [
          providerId,
          metrics.latency_p50,
          metrics.latency_p95,
          metrics.latency_p99,
          metrics.uptime_percent,
          metrics.error_rate
        ]
      );

      // Insert into history
      await db.run(
        `
        INSERT INTO metrics_history
        (provider_id, timestamp, latency_p50, latency_p95, uptime_percent, error_rate)
        VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
      `,
        [
          providerId,
          metrics.latency_p50,
          metrics.latency_p95,
          metrics.uptime_percent,
          metrics.error_rate
        ]
      );

      console.log(
        `  ✓ ${providerId}: p50=${metrics.latency_p50}ms, uptime=${metrics.uptime_percent}%`
      );
    } catch (error) {
      console.error(`  ❌ ${providerId} failed:`, error.message);

      // Mark as error in current_metrics
      await db.run(
        `
        UPDATE current_metrics 
        SET error_rate = 100, last_updated = CURRENT_TIMESTAMP
        WHERE provider_id = ?
      `,
        [providerId]
      );
    }
  }
}

module.exports = new MetricsCollector();
