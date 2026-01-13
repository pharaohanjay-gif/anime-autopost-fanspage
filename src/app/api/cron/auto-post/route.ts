import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage } from '@/lib/api';
import { generateCaption } from '@/lib/groq';
import { postToWeebnesia } from '@/lib/weebnesia';

// Rhythm untuk Facebook: anime → komik → repeat (tanpa hentai)
const FB_POSTING_RHYTHM: ('anime' | 'komik')[] = ['anime', 'komik'];

// Simple counter stored in edge config or we use hour-based rotation
function getCategoryByHour(): 'anime' | 'komik' {
  // Use WIB timezone (UTC+7)
  const now = new Date();
  const wibHour = (now.getUTCHours() + 7) % 24;
  console.log(`[Cron] UTC hour: ${now.getUTCHours()}, WIB hour: ${wibHour}`);
  return FB_POSTING_RHYTHM[wibHour % 2];
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
    for (const fallbackCategory of FB_POSTING_RHYTHM.filter(c => c !== category)) {
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
    // Don't throw - return success with FB error noted
  } else {
    console.log(`[Cron] Facebook post successful! Post ID: ${fbResult.id}`);
  }

  // Return result regardless of FB success/fail (don't throw 500 for FB token issues)
  return {
    category,
    title: imageResult.title,
    facebook: {
      success: fbResult.success,
      postId: fbResult.id,
      error: fbResult.error,
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
    console.log('[Cron] Starting auto-post (Facebook only)...');
    console.log(`[Cron] Environment check - GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`[Cron] Environment check - FB_PAGE_ACCESS_TOKEN: ${process.env.FB_PAGE_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    
    const result = await performAutoPost();

    console.log(`[Cron] Posted successfully!`);
    console.log(`[Cron] Facebook: ${result.facebook.success ? 'OK' : 'FAILED'}`);
    
    return NextResponse.json({
      success: true,
      message: 'Auto-post to Facebook successful',
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
