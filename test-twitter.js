// Direct Twitter API test
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'a7VT21l7gXwbzNGZHkgeHQEll',
  appSecret: 'Gvt09TYxSPc1xBSd7uQYR7FiJfwqUoCWBbPLuscjq4lXtulQzE',
  accessToken: '1816104008484020226-qRcHzWG8M1IxxlVHcxyuPFMgipapzw',
  accessSecret: 'bGZ7XvUzml5HT3RR3ktSVRUFTj59v9bVQjZi3Qni7GDsg',
});

async function test() {
  try {
    console.log('Testing Twitter API...');
    
    // Test 1: Get user info
    console.log('\n1. Getting user info...');
    const me = await client.v2.me();
    console.log('User:', me.data);
    
    // Test 2: Post a simple tweet
    console.log('\n2. Posting test tweet...');
    const tweet = await client.v2.tweet({
      text: `Test dari bot ${new Date().toLocaleTimeString('id-ID')} 🔥`,
    });
    console.log('Tweet posted! ID:', tweet.data.id);
    console.log('URL: https://x.com/cutyHUB1982/status/' + tweet.data.id);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
    
    // Check specific error types
    if (error.code === 401) {
      console.error('\n⚠️  401 = Invalid credentials. Check API keys.');
    } else if (error.code === 403) {
      console.error('\n⚠️  403 = App permission issue or account suspended.');
    } else if (error.code === 429) {
      console.error('\n⚠️  429 = Rate limited. Headers:', error.rateLimit);
    }
  }
}

test();
