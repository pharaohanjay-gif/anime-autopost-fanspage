import { NextResponse } from 'next/server';
import { postToX } from '@/lib/twitter';

export async function GET() {
  try {
    console.log('Testing X (Twitter) post...');
    
    // Test dengan gambar anime
    const testImageUrl = 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg';
    const testCaption = `🎌 Test dari Weebnesia Bot!

Ini adalah test posting otomatis ke X (Twitter).

#Weebnesia #Anime #WibuIndonesia`;

    const result = await postToX(testImageUrl, testCaption);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Tweet posted successfully!',
        tweetId: result.id,
        tweetUrl: `https://x.com/cutyHUB1982/status/${result.id}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
