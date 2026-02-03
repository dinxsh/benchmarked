const https = require('https');

/**
 * QuickNode Adapter
 */
class QuickNodeAdapter {
  constructor() {
    this.endpoint =
      process.env.QUICKNODE_ENDPOINT || 'https://eth-mainnet.quiknode.pro/demo';
    this.sampleSize = 10;
  }

  async measure() {
    const samples = [];
    let errorCount = 0;

    for (let i = 0; i < this.sampleSize; i++) {
      try {
        const latency = await this.testCall();
        samples.push(latency);
      } catch (error) {
        errorCount++;
      }
      await this.sleep(200);
    }

    if (samples.length === 0) throw new Error('All test calls failed');
    samples.sort((a, b) => a - b);

    return {
      latency_p50: this.percentile(samples, 50),
      latency_p95: this.percentile(samples, 95),
      latency_p99: this.percentile(samples, 99),
      uptime_percent: ((this.sampleSize - errorCount) / this.sampleSize) * 100,
      error_rate: (errorCount / this.sampleSize) * 100
    };
  }

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
        timeout: 5000
      };

      const req = https.request(this.endpoint, options, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          const latency = Date.now() - startTime;
          if (res.statusCode === 200) resolve(latency);
          else reject(new Error(`HTTP ${res.statusCode}`));
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.write(postData);
      req.end();
    });
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new QuickNodeAdapter();
