import { NextRequest, NextResponse } from 'next/server';

// SVG placeholder as base64 for fallback
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533">
  <rect width="400" height="533" fill="#1a1a2e"/>
  <rect x="150" y="200" width="100" height="80" fill="#2d2d44" rx="8"/>
  <circle cx="175" cy="230" r="12" fill="#4a4a6a"/>
  <polygon points="160,270 200,240 240,270" fill="#4a4a6a"/>
  <text x="200" y="310" text-anchor="middle" fill="#6b6b8a" font-family="Arial" font-size="14">No Image</text>
</svg>`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    // Return placeholder SVG
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  try {
    // Fetch image from external source with headers mimicking a real browser
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://hanime.tv/',
        'Origin': 'https://hanime.tv',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    if (!response.ok) {
      // If image fetch fails, try poster URL format if it was a cover URL
      if (imageUrl.includes('/covers/')) {
        const posterUrl = imageUrl.replace('/covers/', '/posters/').replace('.png', '.jpg').replace('-cv3', '-pv1');
        const posterResponse = await fetch(posterUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://hanime.tv/',
            'Origin': 'https://hanime.tv',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });
        
        if (posterResponse.ok) {
          const contentType = posterResponse.headers.get('content-type') || 'image/jpeg';
          const imageBuffer = await posterResponse.arrayBuffer();
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
      
      // Return placeholder SVG on failure
      return new NextResponse(PLACEHOLDER_SVG, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    // Return placeholder SVG on error
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
