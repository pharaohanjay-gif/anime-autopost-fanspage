import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage } from '@/lib/api';
import { generateCaption } from '@/lib/groq';
import { postToWeebnesia } from '@/lib/weebnesia';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category = 'anime' } = body;

    console.log(`[Test-${category}] Starting test for category: ${category}`);

    // Get random image
    const imageResult = await getRandomImage(category);

    if (!imageResult) {
      return NextResponse.json({
        success: false,
        error: `No image found for category: ${category}`,
      }, { status: 404 });
    }

    console.log(`[Test-${category}] Image found: ${imageResult.title}`);
    console.log(`[Test-${category}] Image URL: ${imageResult.url}`);

    // Generate caption
    const caption = await generateCaption({
      title: imageResult.title,
      description: imageResult.description || '',
      category: category,
      style: 'jaksel',
      includeHashtags: true,
      customHashtags: ['Weebnesia', 'AnimeIndonesia', 'WibuNation'],
    });

    console.log(`[Test-${category}] Caption generated`);

    // Post to Facebook
    const result = await postToWeebnesia(imageResult.url, caption);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test post successful for ${category}`,
        category,
        title: imageResult.title,
        postId: result.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        category,
        title: imageResult.title,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`[Test] Error:`, error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}