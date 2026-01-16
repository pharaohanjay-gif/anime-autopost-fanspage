import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
    rateLimitInfo: null,
  };

  try {
    const client = new TwitterApi({
      appKey: (process.env.X_API_KEY || '').trim(),
      appSecret: (process.env.X_API_SECRET || '').trim(),
      accessToken: (process.env.X_ACCESS_TOKEN || '').trim(),
      accessSecret: (process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
    });

    // Test 1: Get user info (read endpoint - different rate limit)
    try {
      const me = await client.v2.me();
      results.tests.push({
        name: 'Get User Info',
        success: true,
        data: me.data,
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Get User Info',
        success: false,
        error: e.message,
        code: e.code,
      });
    }

    // Test 2: Try posting a unique tweet
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const tweetText = `Debug test ${uniqueId} - akan dihapus #test`;
    
    try {
      const tweet = await client.v2.tweet({
        text: tweetText,
      });
      
      results.tests.push({
        name: 'Post Tweet',
        success: true,
        tweetId: tweet.data.id,
        tweetUrl: `https://x.com/cutyHUB1982/status/${tweet.data.id}`,
      });
      
      // Try to get rate limit info from headers if available
      if ((tweet as any).rateLimit) {
        results.rateLimitInfo = (tweet as any).rateLimit;
      }
      
      // Delete the test tweet
      try {
        await client.v2.deleteTweet(tweet.data.id);
        results.tests.push({
          name: 'Delete Tweet',
          success: true,
          deletedId: tweet.data.id,
        });
      } catch (delErr: any) {
        results.tests.push({
          name: 'Delete Tweet',
          success: false,
          error: delErr.message,
        });
      }
    } catch (postError: any) {
      results.tests.push({
        name: 'Post Tweet',
        success: false,
        error: postError.message,
        code: postError.code,
        details: postError.data,
        headers: postError.headers || null,
      });
      
      // Check if it's a rate limit error
      if (postError.code === 429) {
        results.rateLimitInfo = {
          isLimited: true,
          message: 'You are being rate limited by Twitter',
          possibleCauses: [
            'Too many requests in short time window (15 min)',
            'App-level rate limit exceeded',
            'User-level rate limit exceeded',
          ],
          solution: 'Wait 15-60 minutes before trying again',
          resetInfo: postError.rateLimit || 'Not available',
        };
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    results.error = {
      message: error.message,
      code: error.code,
      data: error.data,
    };
    return NextResponse.json(results, { status: 500 });
  }
}
