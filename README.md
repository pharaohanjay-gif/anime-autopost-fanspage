# Anime Auto Post Bot - Facebook Fanspage

Bot otomatis untuk posting konten anime ke Facebook Fanspage dengan dukungan AI untuk generate caption.

## Fitur

✅ **Auto Posting** - Bot otomatis posting gambar anime ke Facebook Fanspage
✅ **Scheduled Posts** - Jadwalkan posting untuk waktu tertentu
✅ **AI Caption Generator** - Generate caption menggunakan Groq AI (Llama 3.3)
✅ **Multiple Categories** - Support Anime, Manga/Manhwa, dan Hentai
✅ **Random Image** - Pilih gambar random dari kategori yang dipilih
✅ **Caption Styles** - Pilih style caption (Formal, Casual, Otaku, Meme)
✅ **Custom Hashtags** - Tambahkan hashtag custom
✅ **Image Preview** - Preview gambar sebelum posting

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI**: Groq API (Llama 3.3 70B)
- **State Management**: Zustand
- **API Sources**:
  - Anime: itzzzme-anime-api
  - Manga: api-manga (Shinigami)
  - Hentai: Hanime API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` ke `.env.local` dan isi dengan credentials kamu:

```bash
cp .env.example .env.local
```

Isi file `.env.local`:

```env
# Groq API Key - Get from https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# Facebook Graph API
FB_PAGE_ACCESS_TOKEN=your_page_access_token_here
NEXT_PUBLIC_FB_PAGE_ID=your_page_id_here
```

### 3. Get Facebook Page Access Token

1. Buka [Facebook Developer Portal](https://developers.facebook.com/)
2. Buat atau pilih aplikasi
3. Tambahkan produk "Facebook Login"
4. Generate User Access Token dengan permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Convert ke Page Access Token
6. Copy Page ID dan Access Token ke `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Cara Penggunaan

### 1. Settings
- Masukkan Facebook Page ID
- Masukkan Page Access Token
- Verify token untuk memastikan valid
- Pilih kategori konten yang diinginkan
- Atur style caption

### 2. Browse Images
- Pilih kategori (Anime/Manga/Hentai)
- Browse atau search gambar
- Klik gambar untuk select
- Generate caption dengan AI
- Edit caption jika perlu
- Post langsung atau schedule

### 3. Dashboard
- Lihat statistik posting
- Start/Stop auto posting bot
- Quick actions

### 4. Schedule
- Lihat semua scheduled posts
- Post langsung dari schedule
- Delete scheduled posts

## API Endpoints

### `/api/images`
- `GET ?category=anime&type=latest` - Get images
- `GET ?category=anime&random=true` - Get random image

### `/api/caption`
- `POST` - Generate caption dengan AI

### `/api/facebook`
- `POST` - Facebook operations (verify, post, schedule)

### `/api/bot`
- `POST` - Bot operations (start, stop, status)

## Struktur Folder

```
src/
├── app/
│   ├── api/
│   │   ├── images/route.ts
│   │   ├── caption/route.ts
│   │   ├── facebook/route.ts
│   │   └── bot/route.ts
│   ├── browse/page.tsx
│   ├── schedule/page.tsx
│   ├── settings/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Dashboard.tsx
│   ├── ImageGallery.tsx
│   ├── Layout.tsx
│   ├── Schedule.tsx
│   └── Settings.tsx
├── lib/
│   ├── api.ts
│   ├── facebook.ts
│   ├── groq.ts
│   └── store.ts
└── types/
    └── index.ts
```

## Catatan Penting

⚠️ **Facebook Token**: Page Access Token memiliki masa expired. Untuk production, gunakan Long-Lived Token atau implementasi OAuth flow.

⚠️ **Rate Limiting**: Facebook memiliki rate limit untuk posting. Jangan set interval terlalu cepat (minimal 5 menit).

⚠️ **Content Policy**: Pastikan konten yang diposting sesuai dengan kebijakan Facebook.

⚠️ **Hentai Category**: Kategori ini disabled by default. Gunakan dengan bijak dan pastikan sesuai dengan kebijakan Facebook.

## License

MIT
