import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentHentai } from '@/lib/api';
import { postToX } from '@/lib/twitter';
import Groq from 'groq-sdk';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || '').trim(),
});

// Simple in-memory store untuk track posted items (will reset on deploy)
// Untuk production, gunakan database seperti Redis/Upstash
const postedHashes = new Set<string>();

// Generate hash untuk cek duplicate
function generateHash(title: string): string {
  return crypto.createHash('md5').update(title.toLowerCase().trim()).digest('hex');
}

// Generate caption dewasa untuk hentai dengan gaya SANGAT natural
async function generateHentaiCaption(
  title: string,
  description: string,
  tags: string[],
  brand: string
): Promise<string> {
  try {
    const tagList = tags.slice(0, 5).join(', ');
    
    // Extract character names dari title jika ada
    const characterMatch = title.match(/^([A-Za-z\s]+)/);
    const possibleCharacter = characterMatch ? characterMatch[1].trim() : '';
    
    const prompt = `Kamu adalah manusia biasa yang suka hentai dan aktif di Twitter. Tulis caption untuk share hentai favorit ke followers.

KONTEN YANG DI-SHARE:
- Judul: ${title}
- Studio: ${brand}
- Genre/Tags: ${tagList}
- Sinopsis: ${description.substring(0, 300)}
${possibleCharacter ? `- Kemungkinan nama karakter: ${possibleCharacter}` : ''}

ATURAN PENTING:
1. Tulis dalam Bahasa Indonesia GAUL anak Jakarta (campur slang: literally, vibes, fr, ngl, parah, anjir, gila, bgt, dah, gaskeun, cuy, gue, lo)
2. HARUS menyebut judul atau karakter secara natural dalam kalimat
3. Deskripsikan apa yang menarik dari konten ini (bisa soal cerita, karakter, art style, scene favorit)
4. Ajak orang nonton dengan cara santai, JANGAN hard sell
5. Tulis 2-3 kalimat yang mengalir natural kayak orang curhat ke temen
6. JANGAN pakai format list atau bullet point
7. JANGAN kedengeran kayak AI atau robot
8. Boleh sedikit mesum tapi ga vulgar

CONTOH GAYA PENULISAN YANG BAGUS:
"Anjir gue baru nonton ${title} dan waifunya bikin gue gabisa tidur semalaman. Art stylenya bagus parah terus ceritanya juga ada plot twistnya gitu. Gue recommend banget dah buat yang suka genre ${tagList}, langsung aja cek"

"Gila sih ${title} ini underrated bgt padahal karakternya cakep2 semua. Gue suka bgt sama scene di episode 2 nya, bikin deg2an parah. Worth it buat ditonton sih menurut gue"

TULIS CAPTION SEKARANG (2-3 kalimat natural, max 220 karakter):`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah orang Indonesia biasa yang hobi nonton hentai dan suka share ke Twitter. Tulis seperti manusia yang excited share tontonan favorit, bukan seperti bot atau AI. Gunakan bahasa sehari-hari yang natural.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.95,
    });

    let caption = response.choices[0]?.message?.content?.trim() || '';
    
    // Clean up caption
    caption = caption.replace(/^["']|["']$/g, '');
    caption = caption.replace(/\n+/g, ' ');
    caption = caption.replace(/\s+/g, ' ').trim();
    
    // Add CTA dan hashtags
    const cta = `\n\nNonton lengkap: memenesia.web.id 🔥`;
    const hashtags = '\n#Anime #Japan #Waifu';
    
    // Ensure max 280 chars for Twitter
    const maxCaptionLength = 280 - cta.length - hashtags.length;
    if (caption.length > maxCaptionLength) {
      caption = caption.substring(0, maxCaptionLength - 3) + '...';
    }
    
    return caption + cta + hashtags;
  } catch (error: any) {
    console.error('Error generating hentai caption:', error);
    // Fallback captions yang bervariasi dan natural
    const fallbacks = [
      `Gue baru nonton ${title} dan gila sih ini bagus bgt. Waifunya cakep2, ceritanya juga ada twistnya. Recommend bgt dah\n\nNonton lengkap: memenesia.web.id 🔥\n#Anime #Japan #Waifu`,
      `Anjir ${title} ini underrated parah padahal art stylenya top tier. Karakternya juga likeable semua. Worth it sih\n\nNonton lengkap: memenesia.web.id 🔥\n#Anime #Japan #Waifu`,
      `Ngl gue kecanduan sama ${title}, udah nonton berkali2 dan masih suka aja. Scene favorit gue yang di tengah2, bikin deg2an\n\nNonton lengkap: memenesia.web.id 🔥\n#Anime #Japan #Waifu`,
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
  
  // Filter out already posted items
  const availableItems = hentaiItems.filter(item => {
    const hash = generateHash(item.name);
    return !postedHashes.has(hash);
  });
  
  // If all items have been posted, clear the cache and use all items
  const itemsToUse = availableItems.length > 0 ? availableItems : hentaiItems;
  if (availableItems.length === 0) {
    console.log('[X-Hentai] All items posted, clearing cache...');
    postedHashes.clear();
  }
  
  // Pick random item
  const randomIndex = Math.floor(Math.random() * itemsToUse.length);
  const item = itemsToUse[randomIndex];
  
  // Mark as posted
  const itemHash = generateHash(item.name);
  postedHashes.add(itemHash);
  
  console.log(`[X-Hentai] Selected: ${item.name}`);
  console.log(`[X-Hentai] Hash: ${itemHash}`);
  console.log(`[X-Hentai] Posted items count: ${postedHashes.size}`);
  
  // Get image URL - prefer cover_url for better quality
  const imageUrl = item.cover_url || item.coverImage || item.poster_url || item.bannerImage;
  
  if (!imageUrl) {
    throw new Error('No image URL found for selected item');
  }
  
  console.log(`[X-Hentai] Image URL: ${imageUrl}`);
  
  // Generate caption dengan info lengkap
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
    // Remove from posted if failed
    postedHashes.delete(itemHash);
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
    hash: itemHash,
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
