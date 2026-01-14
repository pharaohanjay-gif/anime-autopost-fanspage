import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const client = new TwitterApi({
      appKey: (process.env.X_API_KEY || '').trim(),
      appSecret: (process.env.X_API_SECRET || '').trim(),
      accessToken: (process.env.X_ACCESS_TOKEN || '').trim(),
      accessSecret: (process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
    });

    // Test dengan mendapatkan info user
    console.log('[Test] Testing Twitter credentials...');
    
    const me = await client.v2.me();
    
    console.log('[Test] User info:', me.data);
    
    // Coba post simple tweet
    const testTweet = `Test bot ${new Date().toISOString().substring(11, 19)} - ignore this`;
    
    const tweet = await client.v2.tweet({
      text: testTweet,
    });
    
    return NextResponse.json({
      success: true,
      user: me.data,
      tweet: {
        id: tweet.data.id,
        text: testTweet,
      },
    });
  } catch (error: any) {
    console.error('[Test] Error:', error.message);
    console.error('[Test] Details:', error.data || error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.data || null,
      code: error.code || null,
    });
  }
}
