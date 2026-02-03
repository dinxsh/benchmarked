const https = require('https');

/**
 * Alchemy Adapter
 * Measures latency and reliability by making test RPC calls
 */
class AlchemyAdapter {
  constructor() {
    this.endpoint =
      process.env.ALCHEMY_ENDPOINT ||
      'https://eth-mainnet.g.alchemy.com/v2/demo';
    this.sampleSize = 10; // Number of test calls
  }

  /**
   * Main measurement function
   */
  async measure() {
    const samples = [];
    let errorCount = 0;

    // Run multiple test calls
    for (let i = 0; i < this.sampleSize; i++) {
      try {
        const latency = await this.testCall();
        samples.push(latency);
      } catch (error) {
        errorCount++;
      }

      // Small delay between calls
      await this.sleep(200);
    }

    if (samples.length === 0) {
      throw new Error('All test calls failed');
    }

    // Calculate percentiles
    samples.sort((a, b) => a - b);

    return {
      latency_p50: this.percentile(samples, 50),
      latency_p95: this.percentile(samples, 95),
      latency_p99: this.percentile(samples, 99),
      uptime_percent: ((this.sampleSize - errorCount) / this.sampleSize) * 100,
      error_rate: (errorCount / this.sampleSize) * 100
    };
  }

  /**
   * Make a single test RPC call and measure latency
   */
  async testCall() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const postData = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      });

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 5000 // 5 second timeout
      };

      const req = https.request(this.endpoint, options, (res) => {
        let data = '';

        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const latency = Date.now() - startTime;

          if (res.statusCode === 200) {
            resolve(latency);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Calculate percentile from sorted array
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;

    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new AlchemyAdapter();
