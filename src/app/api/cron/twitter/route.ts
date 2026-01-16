import { NextRequest, NextResponse } from 'next/server';
import { postToX } from '@/lib/twitter';
import Groq from 'groq-sdk';
import crypto from 'crypto';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Local interface for hentai items
interface HentaiItem {
  id: number;
  name: string;
  titles?: string[];
  slug?: string;
  description: string;
  views?: number;
  bannerImage?: string;
  coverImage?: string;
  cover_url?: string;
  poster_url?: string;
  brand?: {
    name: string;
    id?: number;
  };
  tags?: string[];
  rating?: number;
}

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || '').trim(),
});

// Track posted items untuk anti-duplicate (in-memory, resets on cold start)
const postedHashes = new Set<string>();

function generateHash(title: string): string {
  return crypto.createHash('md5').update(title.toLowerCase().trim()).digest('hex');
}

// Download image with proper headers
async function downloadImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    console.log('[Twitter] Downloading image:', imageUrl);
    
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://hanime.tv/',
      'Origin': 'https://hanime.tv',
    };
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers,
      timeout: 30000,
      maxRedirects: 5,
    });
    
    const buffer = Buffer.from(response.data);
    console.log('[Twitter] Image downloaded, size:', buffer.length, 'bytes');
    
    if (buffer.length < 1000) {
      console.error('[Twitter] Image too small, likely error');
      return null;
    }
    
    return buffer;
  } catch (error: any) {
    console.error('[Twitter] Error downloading image:', error.message);
    return null;
  }
}

// Generate caption dengan Groq AI
async function generateCaption(
  title: string,
  description: string,
  tags: string[],
  brand: string
): Promise<string> {
  try {
    const tagList = tags.slice(0, 5).join(', ');
    
    const prompt = `Kamu reviewer anime dewasa di Twitter. Tulis review/caption PANJANG dan DESKRIPTIF untuk konten berikut:

DETAIL KONTEN:
- Judul: ${title}
- Studio/Brand: ${brand}
- Genre/Tags: ${tagList}
- Sinopsis: ${description.substring(0, 500)}

INSTRUKSI PENULISAN:
1. Bahasa Indonesia gaul tapi tetap informatif (gue, lu, bgt, sih, anjir, literally, vibes)
2. WAJIB sebut judul "${title}" 
3. Tulis 4-5 kalimat PANJANG yang menjelaskan:
   - Cerita/plot singkat
   - Karakter utama atau waifu favorit
   - Art style atau animasinya
   - Kenapa worth it ditonton
4. JANGAN tulis "nonton di..." atau "cek di..." atau promosi apapun
5. Tulis seperti orang yang genuinely excited sharing review
6. Akhiri dengan ajakan diskusi (contoh: "ada yang udah nonton?", "menurut kalian gimana?")

CONTOH GAYA PENULISAN:
"Baru kelar marathon ${title} dan literally ga nyesel. Plotnya unexpectedly deep, ada romance sama drama yang bikin invested. Karakter cewenya juga well-written, bukan cuma fanservice doang. Art stylenya smooth banget, studio ${brand} emang ga pernah ngecewain. Yang belum nonton rugi sih fr fr. Ada yang udah nonton juga?"

TULIS REVIEW (4-5 kalimat, 200-250 karakter):`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Kamu reviewer anime dewasa Indonesia. Tulis review panjang dan deskriptif, BUKAN promosi. Fokus bahas konten, cerita, karakter, dan art style.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 280,
      temperature: 0.9,
    });

    let caption = response.choices[0]?.message?.content?.trim() || '';
    caption = caption.replace(/^["']|["']$/g, '').replace(/\n+/g, ' ').trim();
    
    // REMOVED URL - Twitter blocks memenesia.web.id
    const hashtags = '\n\n#Anime #Waifu #Hentai #WeebnesiaBOT';
    
    const maxLen = 280 - hashtags.length;
    if (caption.length > maxLen) {
      caption = caption.substring(0, maxLen - 3) + '...';
    }
    
    return caption + hashtags;
  } catch (error: any) {
    console.error('[Twitter] Caption generation error:', error.message);
    // Fallback caption
    return `Baru kelar nonton ${title} dan gue harus bilang ini worth it banget. Art stylenya clean, karakternya likeable, ceritanya juga ada plot twist yang ga ketebak. Ada yang udah nonton juga?\n\n#Anime #Waifu #Hentai #WeebnesiaBOT`;
  }
}

// Fetch hentai data directly
async function fetchHentaiData(): Promise<HentaiItem[]> {
  try {
    console.log('[Twitter] Fetching hentai data from API...');
    
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

    console.log(`[Twitter] Fetched ${hits.length} hentai items`);

    return hits.slice(0, 30).map((item: any) => ({
      id: item.id,
      name: item.name,
      titles: item.titles || [],
      slug: item.slug,
      description: item.description || '',
      views: item.views,
      bannerImage: item.poster_url,
      coverImage: item.cover_url,
      cover_url: item.cover_url,
      poster_url: item.poster_url,
      brand: {
        name: item.brand || 'Unknown',
        id: item.brand_id,
      },
      tags: item.tags || [],
      rating: item.rating,
    }));
  } catch (error: any) {
    console.error('[Twitter] Error fetching hentai:', error.message);
    return [];
  }
}

// Main posting function
async function postToTwitter() {
  console.log('[Twitter] Starting auto-post...');
  
  // Fetch hentai items
  const items = await fetchHentaiData();
  
  if (!items || items.length === 0) {
    console.error('[Twitter] No hentai items found');
    return { success: false, error: 'No content available', title: '' };
  }
  
  // Filter out duplicates
  let availableItems = items.filter(item => !postedHashes.has(generateHash(item.name)));
  
  if (availableItems.length === 0) {
    console.log('[Twitter] All items posted, clearing cache...');
    postedHashes.clear();
    availableItems = items;
  }
  
  // Pick random item
  const item = availableItems[Math.floor(Math.random() * availableItems.length)];
  console.log(`[Twitter] Selected: ${item.name}`);
  
  // Mark as posted
  postedHashes.add(generateHash(item.name));
  
  // Get image URL
  const imageUrl = item.cover_url || item.coverImage || item.poster_url || item.bannerImage;
  
  if (!imageUrl) {
    console.error('[Twitter] No image URL for:', item.name);
    return { success: false, error: 'No image available', title: item.name };
  }
  
  console.log('[Twitter] Image URL:', imageUrl);
  
  // Generate caption
  const caption = await generateCaption(
    item.name,
    item.description || '',
    item.tags || [],
    item.brand?.name || 'Unknown'
  );
  
  console.log('[Twitter] Caption generated, length:', caption.length);
  
  // Post to X
  const result = await postToX(imageUrl, caption);
  
  return {
    success: result.success,
    tweetId: result.id || '',
    tweetUrl: result.success ? `https://x.com/cutyHUB1982/status/${result.id}` : '',
    error: result.error || '',
    title: item.name,
  };
}

export async function GET(request: NextRequest) {
  console.log('[Twitter Cron] Starting...');
  
  try {
    const result = await postToTwitter();
    
    console.log(`[Twitter Cron] Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Posted to Twitter successfully',
        result,
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    } else {
      // Return 200 even on failure to prevent cron-job from marking as failed
      // The actual error is in the response body
      return NextResponse.json({
        success: false,
        message: 'Twitter post failed',
        result,
        timestamp: new Date().toISOString(),
      }, { status: 200 }); // Changed from 500 to 200
    }
  } catch (error: any) {
    console.error('[Twitter Cron] Fatal error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // Changed from 500 to 200
  }
}
