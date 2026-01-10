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
    
  jaksel: `KAMU ADALAH ANAK JAKSEL YANG SANGAT GAUL. Tulis caption FULL BAHASA INDONESIA campur slang Jaksel.

WAJIB PAKAI kata-kata ini (pilih beberapa):
- "literally", "lowkey", "highkey", "vibes", "slay" 
- "ngl" (not gonna lie), "fr fr" (for real), "no cap", "bet"
- "gue/gua", "lo/lu", "which is", "basically", "like"
- "aesthetic", "hits different", "main character energy"
- "gaskeun", "healing", "sus", "based", "valid"
- "anjir", "gila sih", "parah", "kocak", "ngeri"

CONTOH YANG BENAR:
"Anjir guys, ini anime literally bikin gue nangis fr fr 😭 Ceritanya tuh lowkey deep banget which is bikin healing parah. Gue gaskeun nonton sampe tamat no cap! Valid sih buat lo yang suka drama 🔥"

"Gila sih ini wibu wajib nonton! Vibes nya aesthetic banget, main character nya hits different fr. Ngl gue udah rewatch 3x, no cap best anime ever 💯"

LARANGAN:
- JANGAN pakai bahasa Inggris penuh
- JANGAN formal/kaku
- JANGAN kayak robot/AI
- Harus NATURAL kayak anak muda Jakarta nulis di sosmed`,
};

const categoryContext: Record<string, string> = {
  anime: 'Ini adalah anime (serial animasi Jepang)',
  komik: 'Ini adalah manga/manhwa/komik',
  hentai: 'Ini adalah konten anime dewasa (18+). Buat caption yang menggoda tapi tetap sopan, fokus ke art style dan story.',
};

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

  const systemPrompt = `Kamu adalah social media manager untuk fanspage Facebook bertema anime.
Tugasmu adalah membuat caption yang menarik untuk postingan gambar anime/manga.
${stylePrompts[style]}

ATURAN PENTING:
1. Caption harus dalam Bahasa Indonesia
2. Maksimal 280 karakter untuk caption utama (tidak termasuk hashtag)
3. Caption harus relevan dengan judul dan deskripsi yang diberikan
4. Jangan gunakan kata-kata kasar atau vulgar
5. Buat caption yang engaging dan bisa mengundang interaksi
${category === 'hentai' ? '6. Jangan terlalu eksplisit, fokus pada aspek artistik dan cerita' : ''}`;

  const userPrompt = `Buatkan caption untuk postingan dengan detail berikut:
  
Judul: ${title}
Kategori: ${categoryContext[category]}
${description ? `Deskripsi: ${description}` : ''}
${additionalContext ? `Konteks tambahan: ${additionalContext}` : ''}

${includeHashtags ? `
Tambahkan hashtag yang relevan di akhir caption.
Hashtag wajib: #Anime #Otaku #Wibu
${customHashtags.length > 0 ? `Hashtag custom: ${customHashtags.map(h => `#${h.replace('#', '')}`).join(' ')}` : ''}
` : 'Jangan tambahkan hashtag.'}

Berikan HANYA caption saja, tanpa penjelasan tambahan.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 500,
    });

    const caption = completion.choices[0]?.message?.content || '';
    return caption.trim();
  } catch (error) {
    console.error('Error generating caption with Groq:', error);
    
    // Fallback caption
    const fallbackHashtags = includeHashtags 
      ? `\n\n#Anime #Otaku #Wibu ${customHashtags.map(h => `#${h.replace('#', '')}`).join(' ')}`
      : '';
    
    return `✨ ${title} ✨\n\n${description || 'Cek konten keren ini!'} ${fallbackHashtags}`;
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
    return {
      caption: `✨ ${existingTitle} ✨\n\n${existingDescription || 'Cek konten anime keren ini!'}`,
      suggestedHashtags: ['Anime', 'Otaku', 'Wibu'],
    };
  }
}
