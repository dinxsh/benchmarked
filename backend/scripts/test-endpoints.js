const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testEndpoint(path, expectedFields) {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE_URL}${path}`, (res) => {
        let data = '';

        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            // Check for expected fields
            const missing = expectedFields.filter((field) => !(field in json));

            if (missing.length > 0) {
              reject(new Error(`Missing fields: ${missing.join(', ')}`));
            } else {
              resolve(json);
            }
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Running API tests...\n');

  const tests = [
    {
      name: 'Leaderboard',
      path: '/api/leaderboard',
      fields: ['data', 'last_updated']
    },
    {
      name: 'Provider Detail',
      path: '/api/provider/alchemy',
      fields: ['provider', 'last_updated']
    },
    {
      name: 'Metrics History',
      path: '/api/metrics/alchemy?timeframe=24h',
      fields: ['data', 'metric', 'timeframe']
    },
    {
      name: 'Compare',
      path: '/api/compare?a=alchemy&b=infura',
      fields: ['provider_a', 'provider_b', 'deltas']
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await testEndpoint(test.path, test.fields);
      console.log(`✓ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
