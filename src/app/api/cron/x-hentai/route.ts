import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentHentai } from '@/lib/api';
import { postToX } from '@/lib/twitter';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || '').trim(),
});

// Generate caption dewasa untuk hentai dengan gaya natural
async function generateHentaiCaption(
  title: string,
  description: string,
  tags: string[],
  brand: string
): Promise<string> {
  try {
    const tagList = tags.slice(0, 5).join(', ');
    
    const prompt = `Kamu adalah admin akun Twitter dewasa yang posting konten hentai/anime 18+. Buat caption SINGKAT (max 200 karakter) untuk postingan ini.

INFO KONTEN:
- Judul: ${title}
- Studio/Brand: ${brand}
- Tags: ${tagList}
- Deskripsi: ${description.substring(0, 200)}

ATURAN CAPTION:
1. HARUS dalam Bahasa Indonesia campur slang Jaksel (literally, vibes, fr fr, ngl, no cap, gaskeun, anjir, parah, bgt)
2. HARUS terasa NATURAL seperti manusia nulis, BUKAN bot
3. HARUS seductive/menggoda tapi tidak vulgar/eksplisit
4. JIKA ada nama karakter di judul/deskripsi, sebutkan secara tidak langsung (misal: "waifunya bikin gue..." atau "karakternya cakep parah...")
5. Gunakan emoji yang sesuai: 🔥💦🥵😏💕
6. SINGKAT dan catchy, langsung ke point
7. Jangan sebutkan kata "hentai" langsung

CONTOH YANG BAGUS:
- "Ngl waifunya di ${title} bikin gue gabisa fokus fr fr 🥵🔥"
- "Anjir vibesnya hot bgt, literally peak content 💦"
- "Gaskeun yang suka oppai, ini surganya sih 😏🔥"
- "No cap karakternya cakep parah, gue suka bgt sama bodynya 💕"

TULIS CAPTION SEKARANG (1 kalimat aja, max 200 karakter):`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah admin Twitter yang posting konten dewasa dengan gaya bahasa anak Jakarta yang gaul dan natural. Tulis caption singkat yang menggoda.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.9,
    });

    let caption = response.choices[0]?.message?.content?.trim() || '';
    
    // Clean up caption
    caption = caption.replace(/^["']|["']$/g, ''); // Remove quotes
    caption = caption.replace(/\n/g, ' '); // Remove newlines
    
    // Add hashtags
    const hashtags = '\n\n#Hentai #NSFW #WaifuMaterial #Ecchi #Oppai';
    
    // Ensure max 280 chars for Twitter
    if (caption.length + hashtags.length > 280) {
      caption = caption.substring(0, 280 - hashtags.length - 3) + '...';
    }
    
    return caption + hashtags;
  } catch (error: any) {
    console.error('Error generating hentai caption:', error);
    // Fallback captions
    const fallbacks = [
      `Ngl ${title} ini vibesnya hot bgt fr fr 🔥🥵\n\n#Hentai #NSFW #WaifuMaterial`,
      `Anjir waifunya cakep parah, literally peak content 💦😏\n\n#Hentai #NSFW #Ecchi`,
      `Gaskeun yang suka oppai, ini surganya bestie 🔥💕\n\n#Hentai #NSFW #WaifuMaterial`,
      `No cap kontennya bikin healing parah, vibes top tier 🥵🔥\n\n#Hentai #NSFW #Oppai`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// Fungsi utama untuk auto-post hentai ke X
async function performHentaiPost() {
  console.log('[X-Hentai] Fetching hentai content...');
  
  // Fetch hentai items
  const hentaiItems = await fetchRecentHentai();
  
  if (!hentaiItems || hentaiItems.length === 0) {
    throw new Error('No hentai content available');
  }
  
  // Pick random item
  const randomIndex = Math.floor(Math.random() * hentaiItems.length);
  const item = hentaiItems[randomIndex];
  
  console.log(`[X-Hentai] Selected: ${item.name}`);
  
  // Get image URL
  const imageUrl = item.cover_url || item.coverImage || item.poster_url || item.bannerImage;
  
  if (!imageUrl) {
    throw new Error('No image URL found for selected item');
  }
  
  console.log(`[X-Hentai] Image URL: ${imageUrl}`);
  
  // Generate caption
  const caption = await generateHentaiCaption(
    item.name,
    item.description || '',
    item.tags || [],
    item.brand?.name || 'Unknown Studio'
  );
  
  console.log(`[X-Hentai] Caption: ${caption}`);
  
  // Post to X
  const result = await postToX(imageUrl, caption);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to post to X');
  }
  
  return {
    title: item.name,
    imageUrl,
    caption,
    tweetId: result.id,
    tweetUrl: `https://x.com/cutyHUB1982/status/${result.id}`,
    tags: item.tags?.slice(0, 5) || [],
    brand: item.brand?.name || 'Unknown',
  };
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow without auth for testing, but log it
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.log('[X-Hentai] Running without auth (testing mode)');
  }
  
  try {
    console.log('[X-Hentai] Starting hentai auto-post to X...');
    
    const result = await performHentaiPost();
    
    console.log(`[X-Hentai] Posted successfully! Tweet: ${result.tweetUrl}`);
    
    return NextResponse.json({
      success: true,
      message: 'Hentai posted to X successfully',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[X-Hentai] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
