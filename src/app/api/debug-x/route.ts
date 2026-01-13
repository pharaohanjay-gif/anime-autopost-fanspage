import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function GET() {
  try {
    const apiKey = process.env.X_API_KEY || '';
    const apiSecret = process.env.X_API_SECRET || '';
    const accessToken = process.env.X_ACCESS_TOKEN || '';
    const accessSecret = process.env.X_ACCESS_TOKEN_SECRET || '';

    // Check if credentials exist
    const credCheck = {
      hasApiKey: apiKey.length > 0,
      apiKeyLength: apiKey.length,
      apiKeyHint: apiKey.substring(0, 5) + '...',
      hasApiSecret: apiSecret.length > 0,
      apiSecretLength: apiSecret.length,
      hasAccessToken: accessToken.length > 0,
      accessTokenLength: accessToken.length,
      accessTokenHint: accessToken.substring(0, 10) + '...',
      hasAccessSecret: accessSecret.length > 0,
      accessSecretLength: accessSecret.length,
    };

    console.log('Credential check:', credCheck);

    // Try to verify credentials using v1.1 API
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    // Try v1.1 verifyCredentials (works with Free tier)
    const me = await client.v1.verifyCredentials();
    
    return NextResponse.json({
      success: true,
      credCheck,
      user: {
        id: me.id_str,
        name: me.name,
        screen_name: me.screen_name,
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    
    // Get more details about the error
    let errorDetails = {
      message: error.message,
      code: error.code,
      data: error.data,
      rateLimit: error.rateLimit,
    };

    return NextResponse.json({
      success: false,
      error: errorDetails,
      credCheck: {
        hasApiKey: (process.env.X_API_KEY || '').length > 0,
        apiKeyHint: (process.env.X_API_KEY || '').substring(0, 5) + '...',
        hasAccessToken: (process.env.X_ACCESS_TOKEN || '').length > 0,
        accessTokenHint: (process.env.X_ACCESS_TOKEN || '').substring(0, 10) + '...',
      },
    }, { status: 500 });
  }
}
