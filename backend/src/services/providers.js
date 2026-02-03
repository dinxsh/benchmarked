/**
 * Provider Adapter Registry
 *
 * Each adapter implements:
 * - measure(): Promise<Metrics>
 *
 * Metrics shape:
 * {
 *   latency_p50: number,
 *   latency_p95: number,
 *   latency_p99: number,
 *   uptime_percent: number,
 *   error_rate: number
 * }
 */

const alchemyAdapter = require('../adapters/alchemy');
const infuraAdapter = require('../adapters/infura');
const quicknodeAdapter = require('../adapters/quicknode');

class ProviderRegistry {
  constructor() {
    this.adapters = new Map();

    // Register adapters
    this.register('alchemy', alchemyAdapter);
    this.register('infura', infuraAdapter);
    this.register('quicknode', quicknodeAdapter);
  }

  register(id, adapter) {
    this.adapters.set(id, adapter);
  }

  get(id) {
    return this.adapters.get(id);
  }

  getAll() {
    return Array.from(this.adapters.keys());
  }
}

module.exports = new ProviderRegistry();
