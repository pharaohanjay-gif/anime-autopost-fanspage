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

    // Get user ID first
    const me = await client.v2.me();
    
    // Get recent tweets from this user (last 24 hours worth)
    const tweets = await client.v2.userTimeline(me.data.id, {
      max_results: 50,
      'tweet.fields': ['created_at', 'text'],
    });

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentTweets = tweets.data?.data?.filter((tweet: any) => {
      const tweetDate = new Date(tweet.created_at);
      return tweetDate >= last24h;
    }) || [];

    return NextResponse.json({
      user: me.data,
      totalFetched: tweets.data?.data?.length || 0,
      tweetsLast24h: recentTweets.length,
      last24hStart: last24h.toISOString(),
      recentTweets: recentTweets.map((t: any) => ({
        id: t.id,
        text: t.text.substring(0, 100) + (t.text.length > 100 ? '...' : ''),
        created_at: t.created_at,
      })),
      allTweets: tweets.data?.data?.slice(0, 20).map((t: any) => ({
        id: t.id,
        text: t.text.substring(0, 80) + (t.text.length > 80 ? '...' : ''),
        created_at: t.created_at,
      })),
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      data: error.data,
    }, { status: 500 });
  }
}
