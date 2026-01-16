import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage, fetchRecentHentai } from '@/lib/api';
import { postToWeebnesia } from '@/lib/weebnesia';
import { postToX } from '@/lib/twitter';
import Groq from 'groq-sdk';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || '').trim(),
});

// Track posted items untuk anti-duplicate
const postedFbHashes = new Set<string>();
const postedXHashes = new Set<string>();

function generateHash(title: string): string {
  return crypto.createHash('md5').update(title.toLowerCase().trim()).digest('hex');
}

// ==================== FACEBOOK CAPTION GENERATOR ====================
async function generateFbCaption(
  title: string,
  description: string,
  category: 'anime' | 'komik' | 'hentai',
  genres?: string[]
): Promise<string> {
  try {
    const genreList = genres?.slice(0, 5).join(', ') || '';
    
    // Extract possible character name dari title
    const words = title.split(/[\s\-:]+/);
    const possibleCharacter = words.find(w => w.length > 2 && /^[A-Z]/.test(w)) || '';
    
    const categoryContext = {
      anime: 'Ini adalah anime (serial animasi Jepang). Bahas tentang karakter, cerita, dan kenapa worth it ditonton.',
      komik: 'Ini adalah manga/manhwa/komik. Bahas tentang art style, plot yang menarik, dan karakter favorit.',
      hentai: 'Ini adalah anime dewasa (18+). Bahas tentang cerita yang menarik dan karakter yang memorable, jangan vulgar.',
    };

    const prompt = `Kamu adalah admin fanspage anime yang SANGAT ANTUSIAS dan suka sharing konten ke followers. Tulis caption untuk postingan ini.

INFO KONTEN:
- Judul: ${title}
- Kategori: ${category}
- Genre: ${genreList}
- Sinopsis: ${description.substring(0, 400)}
${possibleCharacter ? `- Kemungkinan karakter utama: ${possibleCharacter}` : ''}

KONTEKS: ${categoryContext[category]}

ATURAN PENTING:
1. Tulis dalam Bahasa Indonesia GAUL (campur slang: literally, vibes, fr, ngl, parah, anjir, gila, bgt, gaskeun, gue, lo, dah, sih)
2. HARUS menyebut judul "${title}" secara natural dalam kalimat
3. ${possibleCharacter ? `Coba sebut karakter "${possibleCharacter}" jika relevan` : 'Deskripsikan apa yang menarik dari konten'}
4. Tulis 3-4 kalimat yang panjang dan mengalir seperti orang curhat ke temen
5. Akhiri dengan ajakan untuk cek di website (tapi jangan hard sell)
6. JANGAN pakai emoji berlebihan (max 2-3)
7. JANGAN kedengeran kayak AI/robot
8. HARUS terasa seperti manusia yang excited sharing

CONTOH GAYA YANG BAGUS:
"Gila sih ${title} ini baru gue tonton dan langsung jadi favorit. ${possibleCharacter ? possibleCharacter + ' karakternya relatable bgt' : 'Karakternya lovable semua'}, ceritanya juga ga boring sama sekali. Art stylenya bagus parah, tiap scene kayak wallpaper. Highly recommend buat yang belum nonton, cek aja langsung"

TULIS CAPTION SEKARANG (3-4 kalimat, natural dan panjang):`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah admin fanspage anime Indonesia yang antusias. Tulis seperti anak muda Jakarta yang excited sharing tontonan/bacaan favorit. Natural dan tidak seperti bot.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.9,
    });

    let caption = response.choices[0]?.message?.content?.trim() || '';
    
    // Clean up
    caption = caption.replace(/^["']|["']$/g, '');
    caption = caption.replace(/\n+/g, ' ');
    caption = caption.replace(/\s+/g, ' ').trim();
    
    // Add CTA dan hashtags
    const cta = `\n\nCek selengkapnya di memenesia.web.id 🔥`;
    const hashtags = category === 'hentai' 
      ? '\n\n#Anime18 #AnimeDewasa #Weebnesia'
      : '\n\n#Anime #Manga #Weebnesia #AnimeIndonesia';
    
    return caption + cta + hashtags;
  } catch (error: any) {
    console.error('[FB Caption] Error:', error.message);
    const fallbacks = [
      `Gue baru cek ${title} dan gila sih ini bagus banget! Ceritanya engaging, karakternya memorable. Worth it bgt buat ditonton. Cek selengkapnya di memenesia.web.id 🔥\n\n#Anime #Weebnesia`,
      `Anjir ${title} ini underrated parah padahal bagus. Art stylenya cakep, plotnya juga ga ngebosenin. Recommend bgt dah. Cek di memenesia.web.id 🔥\n\n#Anime #Weebnesia`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// ==================== X/TWITTER HENTAI CAPTION GENERATOR ====================
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
    
    // REMOVED URL - Twitter blocks memenesia.web.id
    // Using hashtags only for engagement
    const hashtags = '\n\n#Anime #Waifu #Hentai #WeebnesiaBOT';
    
    const maxLen = 280 - hashtags.length;
    if (caption.length > maxLen) {
      caption = caption.substring(0, maxLen - 3) + '...';
    }
    
    return caption + hashtags;
  } catch (error: any) {
    console.error('[X Caption] Error:', error.message);
    return `Baru kelar nonton ${title} dan gue harus bilang ini worth it banget. Art stylenya clean, karakternya likeable, ceritanya juga ada plot twist yang ga ketebak. Studio ${brand} emang selalu deliver quality. Ada yang udah nonton juga?\n\n#Anime #Waifu #Hentai #WeebnesiaBOT`;
  }
}

// ==================== MAIN AUTO-POST FUNCTION ====================
async function performCombinedAutoPost() {
  const results = {
    facebook: { success: false, postId: '', error: '', title: '', category: '' },
    twitter: { success: false, tweetId: '', tweetUrl: '', error: '', title: '' },
  };

  // ========== FACEBOOK: Random anime/komik/hentai ==========
  console.log('[Combined] Starting Facebook post...');
  try {
    const fbCategories: ('anime' | 'komik' | 'hentai')[] = ['anime', 'komik', 'hentai'];
    const randomCategory = fbCategories[Math.floor(Math.random() * fbCategories.length)];
    
    console.log(`[FB] Selected category: ${randomCategory}`);
    
    let imageResult = await getRandomImage(randomCategory);
    
    // Fallback jika kategori kosong
    if (!imageResult) {
      for (const cat of fbCategories.filter(c => c !== randomCategory)) {
        imageResult = await getRandomImage(cat);
        if (imageResult) break;
      }
    }
    
    if (imageResult) {
      // Check duplicate
      const hash = generateHash(imageResult.title);
      if (postedFbHashes.has(hash)) {
        console.log('[FB] Duplicate detected, getting new content...');
        imageResult = await getRandomImage(randomCategory);
      }
      
      if (imageResult) {
        postedFbHashes.add(generateHash(imageResult.title));
        
        // Generate caption
        const genres = (imageResult.originalData as any)?.genres?.map((g: any) => typeof g === 'string' ? g : g.name) || [];
        const caption = await generateFbCaption(
          imageResult.title,
          imageResult.description || '',
          imageResult.source as 'anime' | 'komik' | 'hentai',
          genres
        );
        
        console.log(`[FB] Posting: ${imageResult.title}`);
        const fbResult = await postToWeebnesia(imageResult.url, caption);
        
        results.facebook = {
          success: fbResult.success,
          postId: fbResult.id || '',
          error: fbResult.error || '',
          title: imageResult.title,
          category: imageResult.source,
        };
      }
    }
  } catch (error: any) {
    console.error('[FB] Error:', error.message);
    results.facebook.error = error.message;
  }

  // ========== TWITTER: Hentai only ==========
  console.log('[Combined] Starting Twitter/X hentai post...');
  try {
    const hentaiItems = await fetchRecentHentai();
    
    if (hentaiItems && hentaiItems.length > 0) {
      // Filter out duplicates
      let availableItems = hentaiItems.filter(item => !postedXHashes.has(generateHash(item.name)));
      
      if (availableItems.length === 0) {
        console.log('[X] All posted, clearing cache...');
        postedXHashes.clear();
        availableItems = hentaiItems;
      }
      
      const item = availableItems[Math.floor(Math.random() * availableItems.length)];
      postedXHashes.add(generateHash(item.name));
      
      const imageUrl = item.cover_url || item.coverImage || item.poster_url || item.bannerImage;
      
      if (imageUrl) {
        const caption = await generateXHentaiCaption(
          item.name,
          item.description || '',
          item.tags || [],
          item.brand?.name || 'Unknown'
        );
        
        console.log(`[X] Posting: ${item.name}`);
        const xResult = await postToX(imageUrl, caption);
        
        results.twitter = {
          success: xResult.success,
          tweetId: xResult.id || '',
          tweetUrl: xResult.success ? `https://x.com/cutyHUB1982/status/${xResult.id}` : '',
          error: xResult.error || '',
          title: item.name,
        };
      }
    }
  } catch (error: any) {
    console.error('[X] Error:', error.message);
    results.twitter.error = error.message;
  }

  return results;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[Combined] Running without auth (testing)');
  }

  try {
    console.log('[Combined] Starting combined auto-post (FB + X)...');
    
    const results = await performCombinedAutoPost();
    
    const anySuccess = results.facebook.success || results.twitter.success;
    
    console.log(`[Combined] Results - FB: ${results.facebook.success ? 'OK' : 'FAILED'}, X: ${results.twitter.success ? 'OK' : 'FAILED'}`);
    
    // Always return 200 to prevent cron-job from marking as failed
    // Actual success/failure is in the response body
    return NextResponse.json({
      success: anySuccess,
      message: anySuccess ? 'Auto-post completed' : 'Both platforms failed (check error details)',
      results,
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // Always 200
  } catch (error: any) {
    console.error('[Combined] Fatal error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // Always 200
  }
}
