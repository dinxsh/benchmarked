async function testSubsquid() {
  const endpoint = 'https://squid.subsquid.io/gs-main/graphql';
  console.log(`Testing GET to ${endpoint}...`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body snippet:', text.substring(0, 200));
  } catch (e) {
    console.error('GET error:', e);
  }

  console.log('\nTesting POST query...');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query {
                    blocks(limit: 1, orderBy: height_DESC) {
                        height
                        timestamp
                    }
                }`
      })
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body snippet:', text.substring(0, 200));
  } catch (e) {
    console.error('POST error:', e);
  }
}

testSubsquid();
