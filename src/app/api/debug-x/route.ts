import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Trim credentials to remove any whitespace/newlines
    const apiKey = (process.env.X_API_KEY || '').trim();
    const apiSecret = (process.env.X_API_SECRET || '').trim();
    const accessToken = (process.env.X_ACCESS_TOKEN || '').trim();
    const accessSecret = (process.env.X_ACCESS_TOKEN_SECRET || '').trim();

    // Check credentials with full length info
    const credCheck = {
      apiKey: {
        length: apiKey.length,
        first5: apiKey.substring(0, 5),
        last3: apiKey.substring(apiKey.length - 3),
      },
      apiSecret: {
        length: apiSecret.length,
        first5: apiSecret.substring(0, 5),
        last3: apiSecret.substring(apiSecret.length - 3),
      },
      accessToken: {
        length: accessToken.length,
        first10: accessToken.substring(0, 10),
        last3: accessToken.substring(accessToken.length - 3),
      },
      accessSecret: {
        length: accessSecret.length,
        first5: accessSecret.substring(0, 5),
        last3: accessSecret.substring(accessSecret.length - 3),
      },
    };

    console.log('Credential check:', JSON.stringify(credCheck, null, 2));

    // Create client
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    // Try to post a simple tweet
    const tweet = await client.v2.tweet('Test dari Weebnesia Bot! 🎌 #anime');
    
    return NextResponse.json({
      success: true,
      credCheck,
      tweet: tweet.data,
      tweetUrl: `https://x.com/cutyHUB1982/status/${tweet.data.id}`,
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    
    const apiKey = (process.env.X_API_KEY || '').trim();
    const apiSecret = (process.env.X_API_SECRET || '').trim();
    const accessToken = (process.env.X_ACCESS_TOKEN || '').trim();
    const accessSecret = (process.env.X_ACCESS_TOKEN_SECRET || '').trim();
    
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        data: error.data,
      },
      credCheck: {
        apiKey: { length: apiKey.length, hint: apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3) },
        apiSecret: { length: apiSecret.length },
        accessToken: { length: accessToken.length, hint: accessToken.substring(0, 10) + '...' + accessToken.substring(accessToken.length - 3) },
        accessSecret: { length: accessSecret.length },
      },
    }, { status: 500 });
  }
}
