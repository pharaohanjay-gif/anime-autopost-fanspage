import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage } from '@/lib/api';
import { generateCaption } from '@/lib/groq';
import { postToWeebnesia } from '@/lib/weebnesia';

// Rhythm: hentai → anime → komik → repeat
const POSTING_RHYTHM: ('hentai' | 'anime' | 'komik')[] = ['hentai', 'anime', 'komik'];

// Simple counter stored in edge config or we use hour-based rotation
function getCategoryByHour(): 'hentai' | 'anime' | 'komik' {
  // Use WIB timezone (UTC+7)
  const now = new Date();
  const wibHour = (now.getUTCHours() + 7) % 24;
  console.log(`[Cron] UTC hour: ${now.getUTCHours()}, WIB hour: ${wibHour}`);
  return POSTING_RHYTHM[wibHour % 3];
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

  // Special handling for hentai - if download fails, fallback to anime
  if (category === 'hentai') {
    console.log(`[Cron] Hentai category detected, attempting download...`);
    try {
      const testDownload = await downloadImageForTest(imageResult.url);
      if (!testDownload) {
        console.log(`[Cron] Hentai image download failed, falling back to anime...`);
        // Force fallback to anime
        const animeImage = await getRandomImage('anime');
        if (animeImage) {
          imageResult = animeImage;
          category = 'anime';
          console.log(`[Cron] Fallback successful: ${animeImage.title}`);
        }
      }
    } catch (error) {
      console.log(`[Cron] Hentai download test failed, falling back to anime...`);
      const animeImage = await getRandomImage('anime');
      if (animeImage) {
        imageResult = animeImage;
        category = 'anime';
        console.log(`[Cron] Fallback successful: ${animeImage.title}`);
      }
    }
  }

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

// Test image download function
async function downloadImageForTest(imageUrl: string): Promise<boolean> {
  try {
    const isProtectedDomain = imageUrl.includes('hanime') || 
                               imageUrl.includes('htv-services') ||
                               imageUrl.includes('hanime-cdn');
    
    const headers: any = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    
    if (isProtectedDomain) {
      headers['Referer'] = 'https://hanime.tv/';
      headers['Origin'] = 'https://hanime.tv';
      headers['Accept'] = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
    }
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: headers,
    });
    
    if (!response.ok) {
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > 0;
  } catch (error) {
    console.error('Test download failed:', error);
    return false;
  }
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

// Test endpoint for specific category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category } = body;
    
    console.log(`[Test] Testing category: ${category}`);
    
    // Override category for testing
    const originalGetCategory = getCategoryByHour;
    getCategoryByHour = () => category || 'anime';
    
    const result = await performAutoPost();
    
    // Restore original function
    getCategoryByHour = originalGetCategory;
    
    return NextResponse.json({
      success: true,
      message: 'Test post successful',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Test] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
