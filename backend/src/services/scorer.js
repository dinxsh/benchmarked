const db = require('../db/client');

/**
 * Scoring algorithm
 * Calculates final scores for all providers based on metrics
 */
class ScoringService {
  /**
   * Calculate scores for all providers
   */
  async calculateAllScores() {
    console.log('🎯 Calculating scores...');

    try {
      // Get all providers with current metrics
      const providers = await db.query(`
        SELECT 
          p.id,
          p.supported_chains,
          p.capabilities,
          p.pricing_info,
          m.latency_p50,
          m.uptime_percent,
          m.error_rate
        FROM providers p
        INNER JOIN current_metrics m ON p.id = m.provider_id
      `);

      // Calculate individual scores
      const scored = providers.map((p) => {
        const scores = this.calculateScores(p);
        return { provider_id: p.id, ...scores };
      });

      // Sort by final score to assign ranks
      scored.sort((a, b) => b.final_score - a.final_score);

      // Update database
      for (let i = 0; i < scored.length; i++) {
        const s = scored[i];
        const rank = i + 1;

        await db.run(
          `
          UPDATE current_metrics
          SET 
            final_score = ?,
            latency_score = ?,
            reliability_score = ?,
            coverage_score = ?,
            dx_score = ?,
            pricing_score = ?,
            rank = ?
          WHERE provider_id = ?
        `,
          [
            s.final_score,
            s.latency_score,
            s.reliability_score,
            s.coverage_score,
            s.dx_score,
            s.pricing_score,
            rank,
            s.provider_id
          ]
        );
      }

      console.log('✓ Scores updated');
    } catch (error) {
      console.error('❌ Scoring failed:', error);
    }
  }

  /**
   * Calculate individual scores for a provider
   */
  calculateScores(provider) {
    // 1. Latency Score (0-100, inverse scale)
    // Lower latency = higher score
    const latency_p50 = provider.latency_p50 || 1000;
    const latency_score = Math.max(0, Math.min(100, 100 - latency_p50 / 10));

    // 2. Reliability Score (0-100, linear)
    const uptime = provider.uptime_percent || 0;
    const reliability_score = uptime;

    // 3. Coverage Score (0-100)
    const chains = JSON.parse(provider.supported_chains || '[]');
    const coverage_score = Math.min(100, (chains.length / 10) * 100);

    // 4. DX Score (0-100, based on capabilities)
    const capabilities = JSON.parse(provider.capabilities || '{}');
    const dx_score = this.calculateDXScore(capabilities);

    // 5. Pricing Score (0-100, inverse of cost)
    const pricing = JSON.parse(provider.pricing_info || '{}');
    const cost = pricing.cost_per_million || 5;
    const pricing_score = Math.max(0, Math.min(100, 100 - cost * 10));

    // Weighted final score
    const final_score =
      latency_score * 0.3 +
      reliability_score * 0.25 +
      coverage_score * 0.2 +
      dx_score * 0.15 +
      pricing_score * 0.1;

    return {
      latency_score: Math.round(latency_score * 100) / 100,
      reliability_score: Math.round(reliability_score * 100) / 100,
      coverage_score: Math.round(coverage_score * 100) / 100,
      dx_score: Math.round(dx_score * 100) / 100,
      pricing_score: Math.round(pricing_score * 100) / 100,
      final_score: Math.round(final_score * 100) / 100
    };
  }

  /**
   * Calculate DX score based on feature completeness
   */
  calculateDXScore(capabilities) {
    const weights = {
      transactions: 20,
      logs: 15,
      token_balances: 15,
      nft_metadata: 10,
      historical_depth: 25,
      custom_indexing: 15
    };

    let score = 0;

    for (const [feature, weight] of Object.entries(weights)) {
      if (capabilities[feature]) {
        score += weight;
      }
    }

    return score;
  }
}

module.exports = new ScoringService();
