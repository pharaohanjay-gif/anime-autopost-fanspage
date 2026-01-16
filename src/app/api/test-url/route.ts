import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || '').trim(),
});

// Fetch one hentai item for testing
async function getTestHentaiItem() {
  try {
    const response = await axios.post('https://search.htv-services.com', {
      blacklist: [],
      brands: [],
      order_by: 'created_at_unix',
      page: 0,
      tags: [],
      search_text: '',
      tags_mode: 'AND',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    let hits: any[] = [];
    if (typeof response.data?.hits === 'string') {
      hits = JSON.parse(response.data.hits);
    } else if (Array.isArray(response.data?.hits)) {
      hits = response.data.hits;
    }

    if (hits.length > 0) {
      const item = hits[Math.floor(Math.random() * Math.min(10, hits.length))];
      return {
        name: item.name,
        description: item.description || '',
        cover_url: item.cover_url,
        poster_url: item.poster_url,
        brand: item.brand || 'Unknown',
        tags: item.tags || [],
      };
    }
    return null;
  } catch (error: any) {
    console.error('[Debug] Error fetching hentai:', error.message);
    return null;
  }
}

// Download image and return buffer
async function downloadImage(imageUrl: string): Promise<Buffer | null> {
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://hanime.tv/',
    };
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers,
      timeout: 30000,
      maxRedirects: 5,
    });
    
    if (response.data.byteLength < 1000) {
      return null;
    }
    
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('[Debug] Error downloading image:', error.message);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const includeUrl = url.searchParams.get('url') !== 'false';
  const includeImage = url.searchParams.get('image') !== 'false';
  
  const results: any = {
    params: { includeUrl, includeImage },
    content: null,
    caption: null,
    captionLength: 0,
    twitterTest: null,
    errors: [],
  };

  try {
    // Step 1: Fetch content
    const item = await getTestHentaiItem();
    if (!item) {
      results.errors.push('Failed to fetch hentai content');
      return NextResponse.json(results, { status: 200 });
    }
    results.content = { name: item.name, brand: item.brand };

    // Step 2: Generate simple caption
    const timestamp = new Date().toISOString().substring(11, 19);
    
    // Caption tanpa URL jika ?url=false
    let caption = `Baru kelar nonton ${item.name} dan gue harus bilang ini worth it banget! Art stylenya clean, karakternya likeable. Studio ${item.brand} emang selalu deliver quality. Ada yang udah nonton juga?`;
    
    if (includeUrl) {
      caption += `\n\nNonton lengkap: memenesia.web.id`;
    }
    
    caption += `\n\n#Anime #Waifu [${timestamp}]`;
    
    results.caption = caption;
    results.captionLength = caption.length;

    // Step 3: Create Twitter client
    const client = new TwitterApi({
      appKey: (process.env.X_API_KEY || '').trim(),
      appSecret: (process.env.X_API_SECRET || '').trim(),
      accessToken: (process.env.X_ACCESS_TOKEN || '').trim(),
      accessSecret: (process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
    });

    // Step 4: Post tweet
    try {
      if (includeImage) {
        const imageUrl = item.cover_url || item.poster_url;
        const imageBuffer = await downloadImage(imageUrl);
        
        if (imageBuffer) {
          const mediaId = await client.v1.uploadMedia(imageBuffer, {
            mimeType: 'image/jpeg',
          });
          
          const tweet = await client.v2.tweet({
            text: caption,
            media: { media_ids: [mediaId] },
          });
          
          results.twitterTest = {
            success: true,
            tweetId: tweet.data.id,
            tweetUrl: `https://x.com/cutyHUB1982/status/${tweet.data.id}`,
            withImage: true,
          };
        } else {
          throw new Error('Image download failed');
        }
      } else {
        const tweet = await client.v2.tweet({
          text: caption,
        });
        
        results.twitterTest = {
          success: true,
          tweetId: tweet.data.id,
          tweetUrl: `https://x.com/cutyHUB1982/status/${tweet.data.id}`,
          withImage: false,
        };
      }
    } catch (tweetError: any) {
      results.twitterTest = {
        success: false,
        error: tweetError.message,
        code: tweetError.code,
        data: tweetError.data,
      };
      results.errors.push('Tweet failed: ' + tweetError.message);
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    results.errors.push('Fatal error: ' + error.message);
    return NextResponse.json(results, { status: 200 });
  }
}
