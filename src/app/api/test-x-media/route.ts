import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Download image and return buffer
async function downloadImage(imageUrl: string): Promise<Buffer | null> {
  try {
    console.log('[Test] Downloading image:', imageUrl);
    
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
    
    console.log('[Test] Image downloaded, size:', response.data.byteLength, 'bytes');
    
    if (response.data.byteLength < 1000) {
      console.error('[Test] Image too small, likely blocked or error');
      return null;
    }
    
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('[Test] Error downloading image:', error.message);
    return null;
  }
}

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
      const item = hits[0];
      return {
        name: item.name,
        cover_url: item.cover_url,
        poster_url: item.poster_url,
        brand: item.brand || 'Unknown',
      };
    }
    return null;
  } catch (error: any) {
    console.error('[Test] Error fetching hentai:', error.message);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const results: any = {
    step1_credentials: false,
    step2_fetch_content: false,
    step3_download_image: false,
    step4_upload_media: false,
    step5_post_tweet: false,
    errors: [],
    details: {},
  };

  try {
    // Step 1: Check credentials
    const client = new TwitterApi({
      appKey: (process.env.X_API_KEY || '').trim(),
      appSecret: (process.env.X_API_SECRET || '').trim(),
      accessToken: (process.env.X_ACCESS_TOKEN || '').trim(),
      accessSecret: (process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
    });
    
    const me = await client.v2.me();
    results.step1_credentials = true;
    results.details.user = me.data;
    console.log('[Test] Step 1 OK - User:', me.data.username);

    // Step 2: Fetch content
    const item = await getTestHentaiItem();
    if (!item) {
      results.errors.push('Failed to fetch hentai content');
      return NextResponse.json(results, { status: 200 });
    }
    results.step2_fetch_content = true;
    results.details.content = { name: item.name, cover_url: item.cover_url, poster_url: item.poster_url };
    console.log('[Test] Step 2 OK - Content:', item.name);

    // Step 3: Download image
    const imageUrl = item.cover_url || item.poster_url;
    if (!imageUrl) {
      results.errors.push('No image URL available');
      return NextResponse.json(results, { status: 200 });
    }

    const imageBuffer = await downloadImage(imageUrl);
    if (!imageBuffer) {
      results.errors.push('Failed to download image from: ' + imageUrl);
      
      // Try alternate URL
      const altUrl = item.poster_url || item.cover_url;
      if (altUrl && altUrl !== imageUrl) {
        console.log('[Test] Trying alternate URL:', altUrl);
        const altBuffer = await downloadImage(altUrl);
        if (altBuffer) {
          results.step3_download_image = true;
          results.details.imageSize = altBuffer.length;
          results.details.imageUrl = altUrl;
        }
      }
      
      if (!results.step3_download_image) {
        return NextResponse.json(results, { status: 200 });
      }
    } else {
      results.step3_download_image = true;
      results.details.imageSize = imageBuffer.length;
      results.details.imageUrl = imageUrl;
    }
    console.log('[Test] Step 3 OK - Image size:', results.details.imageSize);

    // Step 4: Upload media to Twitter
    const finalBuffer = imageBuffer || await downloadImage(item.poster_url || item.cover_url);
    if (!finalBuffer) {
      results.errors.push('No valid image buffer');
      return NextResponse.json(results, { status: 200 });
    }

    try {
      console.log('[Test] Uploading media to Twitter...');
      const mediaId = await client.v1.uploadMedia(finalBuffer, {
        mimeType: 'image/jpeg',
      });
      results.step4_upload_media = true;
      results.details.mediaId = mediaId;
      console.log('[Test] Step 4 OK - Media ID:', mediaId);
    } catch (uploadError: any) {
      results.errors.push('Media upload failed: ' + uploadError.message);
      results.details.uploadError = {
        message: uploadError.message,
        code: uploadError.code,
        data: uploadError.data,
      };
      console.error('[Test] Step 4 FAILED:', uploadError.message);
      
      // Try text-only as fallback
      console.log('[Test] Trying text-only tweet as fallback...');
      try {
        const textTweet = await client.v2.tweet({
          text: `Test dari Weebnesia Bot: ${item.name}\n\n#Anime #Waifu`,
        });
        results.step5_post_tweet = true;
        results.details.fallbackTweet = {
          id: textTweet.data.id,
          url: `https://x.com/cutyHUB1982/status/${textTweet.data.id}`,
          note: 'Posted as text-only due to media upload failure',
        };
      } catch (textError: any) {
        results.errors.push('Text-only tweet also failed: ' + textError.message);
      }
      
      return NextResponse.json(results, { status: 200 });
    }

    // Step 5: Post tweet with media
    try {
      const tweet = await client.v2.tweet({
        text: `Test dengan gambar: ${item.name}\n\n#Anime #Waifu`,
        media: {
          media_ids: [results.details.mediaId],
        },
      });
      results.step5_post_tweet = true;
      results.details.tweet = {
        id: tweet.data.id,
        url: `https://x.com/cutyHUB1982/status/${tweet.data.id}`,
      };
      console.log('[Test] Step 5 OK - Tweet ID:', tweet.data.id);
    } catch (tweetError: any) {
      results.errors.push('Tweet with media failed: ' + tweetError.message);
      results.details.tweetError = {
        message: tweetError.message,
        code: tweetError.code,
        data: tweetError.data,
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    results.errors.push('Fatal error: ' + error.message);
    results.details.fatalError = {
      message: error.message,
      code: error.code,
      data: error.data,
    };
    return NextResponse.json(results, { status: 200 });
  }
}
