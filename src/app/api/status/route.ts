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

    // Get user info to verify credentials
    const me = await client.v2.me();
    
    // Try to get rate limit info
    const timestamp = new Date().toISOString();
    
    return NextResponse.json({
      status: 'API credentials valid',
      user: {
        id: me.data.id,
        name: me.data.name,
        username: me.data.username,
      },
      message: 'Twitter API is accessible. If posting fails with 429, you are rate limited.',
      tips: [
        'Free tier limit: ~17 tweets per 24 hours',
        'Wait a few hours if rate limited',
        'Rate limit resets gradually over time',
      ],
      timestamp,
    }, { status: 200 });
  } catch (error: any) {
    const isRateLimited = error.code === 429 || error.message?.includes('429');
    
    return NextResponse.json({
      status: isRateLimited ? 'RATE LIMITED' : 'ERROR',
      error: error.message,
      code: error.code,
      isRateLimited,
      message: isRateLimited 
        ? 'You are rate limited. Please wait a few hours before posting again.'
        : 'There is an issue with Twitter API access.',
      timestamp: new Date().toISOString(),
    }, { status: isRateLimited ? 429 : 500 });
  }
}
