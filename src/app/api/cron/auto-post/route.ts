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

async function performAutoPost() {
  // Get category based on current hour (rotates hentai → anime → komik)
  let category = getCategoryByHour();
  console.log(`[Cron] Category for this hour: ${category}`);

  // Get random image with fallback to other categories
  let imageResult = await getRandomImage(category);
  
  // If no image from primary category, try others
  if (!imageResult) {
    console.log(`[Cron] No image from ${category}, trying fallback categories...`);
    for (const fallbackCategory of POSTING_RHYTHM.filter(c => c !== category)) {
      imageResult = await getRandomImage(fallbackCategory);
      if (imageResult) {
        category = fallbackCategory;
        console.log(`[Cron] Found image from fallback category: ${fallbackCategory}`);
        break;
      }
    }
  }

  if (!imageResult) {
    throw new Error('No image found from any category');
  }

  console.log(`[Cron] Image found: ${imageResult.title}`);
  console.log(`[Cron] Image URL: ${imageResult.url}`);
  console.log(`[Cron] Image source: ${imageResult.source}`);

  // Generate caption with Jaksel style
  let caption: string;
  try {
    caption = await generateCaption({
      title: imageResult.title,
      description: imageResult.description || '',
      category: category,
      style: 'jaksel',
      includeHashtags: true,
      customHashtags: ['Weebnesia', 'AnimeIndonesia', 'WibuNation'],
    });
    console.log(`[Cron] Caption generated: ${caption.substring(0, 100)}...`);
  } catch (captionError: any) {
    console.error(`[Cron] Caption generation failed: ${captionError.message}`);
    // Use fallback caption
    caption = `🔥 ${imageResult.title}\n\nYuk check out which satu ini, literally keren banget sih!\n\n#Weebnesia #AnimeIndonesia #WibuNation`;
    console.log(`[Cron] Using fallback caption`);
  }

  // Post to Facebook
  console.log(`[Cron] Attempting to post to Facebook...`);
  const result = await postToWeebnesia(imageResult.url, caption);

  if (!result.success) {
    console.error(`[Cron] Facebook post failed: ${result.error}`);
    throw new Error(result.error || 'Failed to post to Facebook');
  }

  return {
    category,
    title: imageResult.title,
    postId: result.id,
    caption: caption.substring(0, 200),
  };
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
    console.log(`[Cron] Environment check - GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`[Cron] Environment check - FB_PAGE_ACCESS_TOKEN: ${process.env.FB_PAGE_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    
    const result = await performAutoPost();

    console.log(`[Cron] Posted successfully! Post ID: ${result.postId}`);
    return NextResponse.json({
      success: true,
      message: 'Auto-post successful',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Error:', error.message);
    console.error('[Cron] Stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

// Also support POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
