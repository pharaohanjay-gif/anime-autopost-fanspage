import { NextResponse } from 'next/server';
import axios from 'axios';

const PAGE_ID = process.env.FB_PAGE_ID || '61585967653974';
const ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';

export async function GET() {
  try {
    console.log('Testing text-only post to feed...');
    
    // Test 1: Post TEXT ONLY ke /feed (tanpa foto)
    const testMessage = `🎌 Test Feed Post - ${new Date().toLocaleString('id-ID')}
    
Ini adalah test posting dari Weebnesia Bot untuk mengecek apakah post muncul di Timeline/Feed.

#Weebnesia #TestPost`;

    const feedResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${PAGE_ID}/feed`,
      {
        message: testMessage,
        access_token: ACCESS_TOKEN,
        published: true,
      }
    );

    console.log('Feed response:', feedResponse.data);

    return NextResponse.json({
      success: true,
      message: 'Text-only post created!',
      postId: feedResponse.data.id,
      testMessage,
      instruction: 'Cek Facebook Page - apakah post ini muncul di Timeline/Feed?'
    });

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return NextResponse.json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorDetails: error.response?.data
    }, { status: 500 });
  }
}
