async function testFallback() {
  const endpoint =
    'https://v2.archive.subsquid.io/network/ethereum-mainnet/height';
  console.log(`Testing GET to ${endpoint}...`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET'
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('GET error:', e);
  }
}

testFallback();
