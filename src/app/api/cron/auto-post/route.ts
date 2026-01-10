import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage } from '@/lib/api';
import { generateCaption } from '@/lib/groq';
import { postToWeebnesia } from '@/lib/weebnesia';

// Rhythm: hentai → anime → komik → repeat
const POSTING_RHYTHM: ('hentai' | 'anime' | 'komik')[] = ['hentai', 'anime', 'komik'];

// Simple counter stored in edge config or we use hour-based rotation
function getCategoryByHour(): 'hentai' | 'anime' | 'komik' {
  const hour = new Date().getHours();
  return POSTING_RHYTHM[hour % 3];
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without secret for testing, but log it
    console.log('[Cron] Running auto-post (no auth check)');
  }

  try {
    console.log('[Cron] Starting auto-post...');
    
    // Get category based on current hour (rotates hentai → anime → komik)
    const category = getCategoryByHour();
    console.log(`[Cron] Category for this hour: ${category}`);

    // Get random image
    const imageResult = await getRandomImage(category);
    
    if (!imageResult) {
      console.error('[Cron] No image found');
      return NextResponse.json({ 
        success: false, 
        error: 'No image found',
        category 
      }, { status: 500 });
    }

    console.log(`[Cron] Image found: ${imageResult.title}`);
    console.log(`[Cron] Image URL: ${imageResult.url}`);

    // Generate caption with Jaksel style
    const caption = await generateCaption({
      title: imageResult.title,
      description: imageResult.description || '',
      category: category,
      style: 'jaksel',
      includeHashtags: true,
      customHashtags: ['Weebnesia', 'AnimeIndonesia', 'WibuNation'],
    });

    console.log(`[Cron] Caption generated: ${caption.substring(0, 100)}...`);

    // Post to Facebook
    const result = await postToWeebnesia(imageResult.url, caption);

    if (result.success) {
      console.log(`[Cron] Posted successfully! Post ID: ${result.id}`);
      return NextResponse.json({
        success: true,
        message: 'Auto-post successful',
        category,
        title: imageResult.title,
        postId: result.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`[Cron] Failed to post: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error,
        category,
        title: imageResult.title,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Cron] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// Also support POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
