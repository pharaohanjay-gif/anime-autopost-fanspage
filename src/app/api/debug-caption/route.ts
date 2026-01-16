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

// Generate caption dengan Groq AI - sama seperti di combined
async function generateXHentaiCaption(
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
    
    // CTA yang lebih subtle - di akhir sebagai "sumber" bukan ajakan
    const cta = `\n\nmemenesia.web.id`;
    const hashtags = '\n#Anime #Waifu #AnimeReview';
    
    const maxLen = 280 - cta.length - hashtags.length;
    if (caption.length > maxLen) {
      caption = caption.substring(0, maxLen - 3) + '...';
    }
    
    return caption + cta + hashtags;
  } catch (error: any) {
    console.error('[X Caption] Error:', error.message);
    return `Baru kelar nonton ${title} dan gue harus bilang ini worth it banget. Art stylenya clean, karakternya likeable, ceritanya juga ada plot twist yang ga ketebak. Studio ${brand} emang selalu deliver quality. Ada yang udah nonton juga?\n\nmemenesia.web.id\n#Anime #Waifu #AnimeReview`;
  }
}

export async function GET(request: NextRequest) {
  const results: any = {
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
    results.content = item;

    // Step 2: Generate caption (sama seperti combined)
    const caption = await generateXHentaiCaption(
      item.name,
      item.description,
      item.tags,
      item.brand
    );
    results.caption = caption;
    results.captionLength = caption.length;

    // Step 3: Test tweet dengan caption yang sama
    const client = new TwitterApi({
      appKey: (process.env.X_API_KEY || '').trim(),
      appSecret: (process.env.X_API_SECRET || '').trim(),
      accessToken: (process.env.X_ACCESS_TOKEN || '').trim(),
      accessSecret: (process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
    });

    // Truncate jika perlu
    let tweetText = caption;
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
      results.truncated = true;
      results.truncatedCaption = tweetText;
    }

    try {
      const tweet = await client.v2.tweet({
        text: tweetText,
      });
      results.twitterTest = {
        success: true,
        tweetId: tweet.data.id,
        tweetUrl: `https://x.com/cutyHUB1982/status/${tweet.data.id}`,
      };
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
