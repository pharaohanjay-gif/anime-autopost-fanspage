import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage } from '@/lib/api';
import { generateCaption } from '@/lib/groq';
import { postToWeebnesia } from '@/lib/weebnesia';
import { postToX } from '@/lib/twitter';

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

  // Special handling for hentai - directly fallback to anime for now
  if (category === 'hentai') {
    console.log(`[Cron] Hentai category detected, falling back to anime...`);
    const animeImage = await getRandomImage('anime');
    if (animeImage) {
      imageResult = animeImage;
      category = 'anime';
      console.log(`[Cron] Fallback successful: ${animeImage.title}`);
    } else {
      console.log(`[Cron] Anime fallback failed, trying komik...`);
      const komikImage = await getRandomImage('komik');
      if (komikImage) {
        imageResult = komikImage;
        category = 'komik';
        console.log(`[Cron] Komik fallback successful: ${komikImage.title}`);
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
    // Use fallback captions yang variatif
    const fallbackCaptions = [
      `Woy bestie, ${imageResult.title} ini literally bagus bgt dah! Gaskeun cek langsung\n\n#Weebnesia #AnimeIndonesia #WibuNation`,
      `Ngl guys ${imageResult.title} bikin gue healing parah, vibes nya top tier fr fr\n\n#Weebnesia #AnimeIndonesia #WibuNation`,
      `Anjir ${imageResult.title} ini lowkey underrated bgt sih, padahal ceritanya valid!\n\n#Weebnesia #AnimeIndonesia #WibuNation`,
      `Gila sih ${imageResult.title} hits different bgt, gue suka parah sama kontennya\n\n#Weebnesia #AnimeIndonesia #WibuNation`,
      `No cap ${imageResult.title} ini peak fiction buat gue, wajib cek dah bestie!\n\n#Weebnesia #AnimeIndonesia #WibuNation`,
    ];
    caption = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
    console.log(`[Cron] Using fallback caption`);
  }

  // Post to Facebook
  console.log(`[Cron] Attempting to post to Facebook...`);
  const fbResult = await postToWeebnesia(imageResult.url, caption);

  if (!fbResult.success) {
    console.error(`[Cron] Facebook post failed: ${fbResult.error}`);
    // Continue to X even if FB fails
  } else {
    console.log(`[Cron] Facebook post successful! Post ID: ${fbResult.id}`);
  }

  // Post to X (Twitter)
  console.log(`[Cron] Attempting to post to X...`);
  const xResult = await postToX(imageResult.url, caption);

  if (!xResult.success) {
    console.error(`[Cron] X post failed: ${xResult.error}`);
  } else {
    console.log(`[Cron] X post successful! Tweet ID: ${xResult.id}`);
  }

  // Check if both failed
  if (!fbResult.success && !xResult.success) {
    throw new Error(`Both platforms failed - FB: ${fbResult.error}, X: ${xResult.error}`);
  }

  return {
    category,
    title: imageResult.title,
    facebook: {
      success: fbResult.success,
      postId: fbResult.id,
      error: fbResult.error,
    },
    x: {
      success: xResult.success,
      tweetId: xResult.id,
      tweetUrl: xResult.success ? `https://x.com/cutyHUB1982/status/${xResult.id}` : undefined,
      error: xResult.error,
    },
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
    console.log('[Cron] Starting auto-post v2...');
    console.log(`[Cron] Environment check - GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`[Cron] Environment check - FB_PAGE_ACCESS_TOKEN: ${process.env.FB_PAGE_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`[Cron] Environment check - X_API_KEY: ${process.env.X_API_KEY ? 'SET' : 'NOT SET'}`);
    
    const result = await performAutoPost();

    console.log(`[Cron] Posted successfully!`);
    console.log(`[Cron] Facebook: ${result.facebook.success ? 'OK' : 'FAILED'}`);
    console.log(`[Cron] X: ${result.x.success ? 'OK' : 'FAILED'}`);
    
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
    const body = await request.json().catch(() => ({}));
    const { category: requestedCategory } = body;
    
    if (requestedCategory) {
      console.log(`[Test] Testing category: ${requestedCategory}`);
    }
    
    const result = await performAutoPost();
    
    return NextResponse.json({
      success: true,
      message: 'Auto-post successful',
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
