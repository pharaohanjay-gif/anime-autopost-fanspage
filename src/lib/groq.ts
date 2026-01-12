import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export type CaptionStyle = 'formal' | 'casual' | 'otaku' | 'meme' | 'jaksel';

interface GenerateCaptionOptions {
  title: string;
  description?: string;
  category: 'anime' | 'komik' | 'hentai';
  style: CaptionStyle;
  includeHashtags: boolean;
  customHashtags?: string[];
  additionalContext?: string;
}

const stylePrompts: Record<CaptionStyle, string> = {
  formal: `Buat caption yang profesional dan informatif dalam Bahasa Indonesia.
    Gunakan bahasa yang sopan dan mudah dipahami.
    Fokus pada informasi faktual tentang konten.`,
  
  casual: `Buat caption yang santai dan friendly dalam Bahasa Indonesia.
    Gunakan bahasa sehari-hari yang asik.
    Buat pembaca merasa seperti sedang ngobrol dengan teman.`,
  
  otaku: `Buat caption dengan gaya otaku/wibu dalam Bahasa Indonesia.
    Boleh pakai istilah-istilah Jepang seperti kawaii, sugoi, nani, dll.
    Tunjukkan enthusiasm sebagai fans anime/manga sejati.
    Bisa pakai emoticon yang sesuai.`,
  
  meme: `Buat caption yang lucu dan meme-worthy dalam Bahasa Indonesia.
    Pakai humor yang relate dengan komunitas anime/wibu.
    Bisa pakai reference ke meme populer.
    Gunakan bahasa gaul dan slang internet.`,
    
  jaksel: `KAMU ADALAH ANAK JAKSEL YANG SANGAT GAUL DAN SUKA ANIME. Tulis caption FULL BAHASA INDONESIA campur slang Jaksel yang UNIK dan BERBEDA setiap kali.

WAJIB PAKAI kata-kata ini secara RANDOM (minimal 3-4):
- "literally", "lowkey", "highkey", "vibes", "slay", "bestie"
- "ngl" (not gonna lie), "fr fr" (for real), "no cap", "bet", "valid"
- "gue/gua", "lo/lu", "which is", "basically", "like", "tho"
- "aesthetic", "hits different", "main character energy", "top tier"
- "gaskeun", "healing", "sus", "based", "peak fiction", "masterpiece"
- "anjir", "gila sih", "parah", "kocak", "ngeri", "mantep", "cakep"
- "woy", "dah", "dong", "sih", "banget", "bgt", "bener"

PENTING - CAPTION HARUS:
1. UNIK dan BERBEDA setiap posting (jangan pernah sama!)
2. RELEVAN dengan judul/konten yang di-post
3. Terasa NATURAL kayak anak muda Jakarta nulis di sosmed
4. Ada EMOSI dan REAKSI yang genuine
5. JANGAN pakai emoji aneh atau simbol yang rusak

CONTOH YANG BENAR (variasi berbeda):
- "Woy bestie, ${'{title}'} ini literally peak fiction fr fr! Gue sampe gabisa tidur nontonin, hits different bgt dah"
- "Ngl guys ${'{title}'} bikin gue healing parah, vibes nya aesthetic bgt which is cocok buat lo yang butuh comfort anime"
- "Anjir ${'{title}'} ini top tier bgt sih no cap! Main character nya based parah, gue suka bgt sama development nya"
- "Gila sih ${'{title}'} lowkey underrated bgt, padahal ceritanya valid dan art nya cakep. Gaskeun nonton dah!"

LARANGAN KERAS:
- JANGAN gunakan emoji yang bisa rusak seperti yang ada simbol aneh
- JANGAN pakai bahasa Inggris full/formal
- JANGAN copy paste format yang sama terus
- JANGAN kayak robot/AI - harus GENUINE`,
};

const categoryContext: Record<string, string> = {
  anime: 'Ini adalah anime (serial animasi Jepang). Bahas tentang cerita, karakter, atau visual nya.',
  komik: 'Ini adalah manga/manhwa/komik. Bahas tentang art style, plot, atau karakter favorit.',
  hentai: 'Ini adalah konten anime dewasa (18+). Buat caption yang menggoda tapi sopan, fokus ke art style yang bagus dan cerita yang menarik. JANGAN eksplisit.',
};

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&')  // Replace &amp;
    .replace(/&lt;/g, '<')   // Replace &lt;
    .replace(/&gt;/g, '>')   // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

export async function generateCaption(options: GenerateCaptionOptions): Promise<string> {
  const {
    title,
    description,
    category,
    style,
    includeHashtags,
    customHashtags = [],
    additionalContext,
  } = options;

  // Clean description from HTML
  const cleanDescription = description ? stripHtml(description) : '';
  
  // Random seed untuk variasi
  const randomSeed = Math.random().toString(36).substring(7);
  const randomMood = ['excited', 'chill', 'hype', 'wholesome', 'amazed'][Math.floor(Math.random() * 5)];

  const systemPrompt = `Kamu adalah social media manager untuk fanspage Facebook bertema anime bernama Weebnesia.
Tugasmu adalah membuat caption yang UNIK dan MENARIK untuk postingan gambar anime/manga.

${stylePrompts[style]}

ATURAN WAJIB:
1. Caption HARUS dalam Bahasa Indonesia (campur slang Jaksel)
2. JANGAN copy paste - buat dengan kata-kata sendiri yang UNIK
3. JANGAN pakai bahasa Inggris formal
4. Caption utama 100-150 karakter, lalu hashtag
5. JANGAN pakai emoji yang bisa error/rusak (hindari emoji kompleks)
6. Emoji yang AMAN: emot standar saja atau skip emoji
7. JANGAN tampilkan tag HTML apapun
8. WAJIB sebutkan judul "${title}" dalam caption
9. Mood caption kali ini: ${randomMood}
${category === 'hentai' ? '10. Untuk konten dewasa: fokus ke art style dan cerita, jangan eksplisit' : ''}`;

  const userPrompt = `Buat caption JAKSEL yang UNIK untuk posting ini:
  
Judul: ${title}
Kategori: ${categoryContext[category]}
${cleanDescription ? `Info: ${cleanDescription.substring(0, 300)}` : 'Tidak ada deskripsi tambahan'}

Random seed: ${randomSeed} (gunakan ini untuk bikin variasi)
Mood: ${randomMood}

FORMAT OUTPUT:
[Caption jaksel yang unik, sebutkan judul, relevan dengan konten]

${customHashtags.length > 0 ? `#${customHashtags.join(' #')}` : '#Weebnesia #Anime #Wibu'}

LANGSUNG tulis caption tanpa penjelasan:`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 1.0, // Higher temperature untuk lebih variatif
      max_tokens: 300,
      top_p: 0.95,
    });

    let caption = completion.choices[0]?.message?.content || '';
    
    // Extra cleanup
    caption = stripHtml(caption);
    
    // Remove broken emoji characters (replacement character)
    caption = caption.replace(/\uFFFD/g, '').trim();
    
    // Ensure hashtags are included if not present
    if (includeHashtags && !caption.includes('#')) {
      const hashtags = customHashtags.length > 0 
        ? `#${customHashtags.join(' #')}`
        : '#Weebnesia #Anime #Wibu #AnimeIndonesia';
      caption = `${caption}\n\n${hashtags}`;
    }
    
    return caption.trim();
  } catch (error) {
    console.error('Error generating caption with Groq:', error);
    
    // Fallback captions yang variatif
    const fallbackCaptions = [
      `Woy bestie, ${title} ini literally bagus bgt dah! Gaskeun cek langsung`,
      `Ngl guys ${title} bikin gue healing parah, vibes nya top tier fr fr`,
      `Anjir ${title} ini lowkey underrated bgt sih, padahal ceritanya valid!`,
      `Gila sih ${title} hits different bgt, gue suka parah sama kontennya`,
      `No cap ${title} ini peak fiction buat gue, wajib cek dah bestie!`,
    ];
    
    const randomFallback = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
    const hashtags = customHashtags.length > 0 
      ? `#${customHashtags.join(' #')}`
      : '#Weebnesia #Anime #Wibu';
    
    return `${randomFallback}\n\n${hashtags}`;
  }
}

export async function generateCaptionFromImage(
  imageUrl: string,
  title: string,
  category: 'anime' | 'komik' | 'hentai',
  style: CaptionStyle = 'otaku',
  includeHashtags: boolean = true,
  customHashtags: string[] = []
): Promise<string> {
  // Since Groq doesn't support vision yet, we generate based on title and category
  return generateCaption({
    title,
    category,
    style,
    includeHashtags,
    customHashtags,
    additionalContext: `URL Gambar: ${imageUrl}`,
  });
}

export async function analyzeImageAndGenerateCaption(
  imageUrl: string,
  existingTitle: string,
  existingDescription: string,
  category: 'anime' | 'komik' | 'hentai',
  style: CaptionStyle = 'otaku'
): Promise<{ caption: string; suggestedHashtags: string[] }> {
  const systemPrompt = `Kamu adalah AI yang ahli dalam anime, manga, dan budaya Jepang.
Berdasarkan judul dan deskripsi yang diberikan, buatkan:
1. Caption yang menarik dan engaging
2. Saran hashtag yang relevan

Format output HARUS dalam JSON:
{
  "caption": "caption disini",
  "suggestedHashtags": ["hashtag1", "hashtag2", ...]
}`;

  const userPrompt = `Analisis konten berikut dan buatkan caption:

Judul: ${existingTitle}
Deskripsi: ${existingDescription || 'Tidak ada deskripsi'}
Kategori: ${category}
Style: ${style}
URL Gambar: ${imageUrl}

Buatkan caption yang sesuai dengan style "${style}" dan kategori "${category}".
Berikan output dalam format JSON yang valid.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 600,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Try to parse JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          caption: parsed.caption || existingTitle,
          suggestedHashtags: parsed.suggestedHashtags || ['Anime', 'Otaku', 'Wibu'],
        };
      }
    } catch (parseError) {
      console.error('Error parsing Groq response:', parseError);
    }
    
    // If JSON parsing fails, use the response as caption
    return {
      caption: response.trim() || existingTitle,
      suggestedHashtags: ['Anime', 'Otaku', 'Wibu', category],
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    // Fallback dengan Jaksel style
    const fallbacks = [
      `Woy bestie, ${existingTitle} ini literally bagus bgt dah!`,
      `Ngl guys ${existingTitle} bikin gue healing parah fr fr`,
      `Anjir ${existingTitle} ini lowkey underrated bgt sih!`,
    ];
    return {
      caption: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      suggestedHashtags: ['Anime', 'Otaku', 'Wibu'],
    };
  }
}
