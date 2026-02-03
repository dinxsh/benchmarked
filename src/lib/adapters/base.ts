import { IProviderAdapter, ProviderMetrics, Provider } from '../benchmark-types';

export abstract class BaseAdapter implements IProviderAdapter {
  abstract id: string;
  abstract name: string;
  protected endpoint: string = '';
  protected sampleSize: number = 3; // Reduced for frontend performance

  abstract getMetadata(): Omit<
    Provider,
    'current_metrics' | 'scores' | 'rank' | 'trend' | 'health_status'
  >;

  async measure(): Promise<ProviderMetrics> {
    const samples: number[] = [];
    let errorCount = 0;

    for (let i = 0; i < this.sampleSize; i++) {
      try {
        const latency = await this.testCall();
        samples.push(latency);
      } catch (error) {
        errorCount++;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (samples.length === 0) {
      return {
        latency_p50: 0,
        latency_p95: 0,
        latency_p99: 0,
        uptime_percent: 0,
        error_rate: 100
      };
    }

    samples.sort((a, b) => a - b);

    // Calculate real uptime based on successful samples vs total attempts
    const successRate =
      ((this.sampleSize - errorCount) / this.sampleSize) * 100;

    return {
      latency_p50: this.percentile(samples, 50),
      latency_p95: this.percentile(samples, 95),
      latency_p99: this.percentile(samples, 99),
      uptime_percent: Number(successRate.toFixed(2)),
      error_rate: Number((100 - successRate).toFixed(2))
    };
  }

  protected async testCall(): Promise<number> {
    const startTime = performance.now();
    try {
      if (!this.endpoint) throw new Error('No endpoint');

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(3000)
      });

      // We accept 401s as "network alive" for latency measurement purposes in this demo
      if (response.status >= 500) throw new Error(`HTTP ${response.status}`);

      // Consume body
      await response.text().catch(() => { });

      return Math.round(performance.now() - startTime);
    } catch (error) {
      throw error;
    }
  }

  protected percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  }

  async getBlockHeight(): Promise<number> {
    try {
      if (!this.endpoint) return 0;

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) return 0;

      const data = await response.json();
      if (data.result) {
        return parseInt(data.result, 16);
      }
      return 0;
    } catch (error) {
      console.warn(`Failed to get block height for ${this.id}:`, error);
      return 0;
    }
  }
}
