import axios from 'axios';
import { AnimeItem, KomikItem, HentaiItem, ImageResult } from '@/types';

// Base API URLs - Using Jikan API (MyAnimeList) which is more stable
const JIKAN_API = 'https://api.jikan.moe/v4';
const KOMIK_API = 'https://api-manga-five.vercel.app';
const HANIME_SEARCH_API = 'https://search.htv-services.com';

// Helper function to add delay (Jikan has rate limit)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Anime API Service using Jikan (MyAnimeList API)
export async function fetchLatestAnime(): Promise<AnimeItem[]> {
  try {
    const response = await axios.get(`${JIKAN_API}/seasons/now`, {
      params: { page: 1, limit: 20 },
      timeout: 15000,
    });
    
    const animeList = response.data?.data || [];
    
    return animeList.map((item: any) => ({
      id: item.mal_id?.toString() || '',
      urlId: item.mal_id?.toString() || '',
      title: item.title || item.title_english || '',
      judul: item.title || item.title_english || '',
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      thumbnail_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      episode: item.episodes ? `${item.episodes} eps` : 'Ongoing',
      rating: item.score?.toString() || '?',
      type: item.type || 'TV',
      description: item.synopsis || '',
      genres: item.genres?.map((g: any) => g.name) || [],
      status: item.status || 'Airing',
    }));
  } catch (error) {
    console.error('Error fetching latest anime:', error);
    return [];
  }
}

export async function fetchPopularAnime(): Promise<AnimeItem[]> {
  try {
    const response = await axios.get(`${JIKAN_API}/top/anime`, {
      params: { page: 1, limit: 20, filter: 'bypopularity' },
      timeout: 15000,
    });
    
    const animeList = response.data?.data || [];
    
    return animeList.map((item: any) => ({
      id: item.mal_id?.toString() || '',
      urlId: item.mal_id?.toString() || '',
      title: item.title || item.title_english || '',
      judul: item.title || item.title_english || '',
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      thumbnail_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      episode: item.episodes ? `${item.episodes} eps` : '?',
      rating: item.score?.toString() || '?',
      type: item.type || 'TV',
      description: item.synopsis || '',
      genres: item.genres?.map((g: any) => g.name) || [],
      status: item.status || '',
    }));
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    return [];
  }
}

export async function fetchTrendingAnime(): Promise<AnimeItem[]> {
  try {
    const response = await axios.get(`${JIKAN_API}/top/anime`, {
      params: { page: 1, limit: 20, filter: 'airing' },
      timeout: 15000,
    });
    
    const animeList = response.data?.data || [];
    
    return animeList.map((item: any) => ({
      id: item.mal_id?.toString() || '',
      urlId: item.mal_id?.toString() || '',
      title: item.title || item.title_english || '',
      judul: item.title || item.title_english || '',
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      thumbnail_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      episode: item.episodes ? `${item.episodes} eps` : 'Ongoing',
      rating: item.score?.toString() || '?',
      type: 'Trending',
      description: item.synopsis || '',
      genres: item.genres?.map((g: any) => g.name) || [],
      status: item.status || 'Airing',
    }));
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return [];
  }
}

export async function fetchAnimeDetail(urlId: string): Promise<AnimeItem | null> {
  try {
    const response = await axios.get(`${JIKAN_API}/anime/${urlId}`, {
      timeout: 15000,
    });
    
    const data = response.data?.data;
    if (!data) return null;
    
    return {
      id: data.mal_id?.toString() || urlId,
      urlId: data.mal_id?.toString() || urlId,
      title: data.title || data.title_english || '',
      judul: data.title || data.title_english || '',
      image: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || '',
      thumbnail_url: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || '',
      description: data.synopsis || '',
      rating: data.score?.toString() || '?',
      type: data.type || 'TV',
      status: data.status || '',
      genres: data.genres?.map((g: any) => g.name) || [],
    };
  } catch (error) {
    console.error('Error fetching anime detail:', error);
    return null;
  }
}

export async function searchAnime(query: string): Promise<AnimeItem[]> {
  try {
    const response = await axios.get(`${JIKAN_API}/anime`, {
      params: { q: query, page: 1, limit: 20 },
      timeout: 15000,
    });
    
    const animeList = response.data?.data || [];
    
    return animeList.map((item: any) => ({
      id: item.mal_id?.toString() || '',
      urlId: item.mal_id?.toString() || '',
      title: item.title || item.title_english || '',
      judul: item.title || item.title_english || '',
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      thumbnail_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      episode: item.episodes ? `${item.episodes} eps` : '?',
      rating: item.score?.toString() || '?',
      type: item.type || 'TV',
      description: item.synopsis || '',
    }));
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
}

// Komik API Service
export async function fetchLatestKomik(): Promise<KomikItem[]> {
  try {
    const response = await axios.get(`${KOMIK_API}/terbaru`, {
      params: { provider: 'shinigami', page: 1 },
      timeout: 15000,
    });
    
    const komikList = response.data?.data || [];
    
    return komikList.map((item: any) => ({
      id: item.href?.split('/').pop() || item.id,
      manga_id: item.href?.split('/').pop() || item.id,
      title: item.title,
      judul: item.title,
      image: item.thumbnail || item.cover_image_url || item.image,
      thumbnail: item.thumbnail,
      cover_image_url: item.thumbnail,
      chapter: item.chapter || '?',
      type: item.type || 'Manhwa',
      status: item.status || 'Ongoing',
    }));
  } catch (error) {
    console.error('Error fetching latest komik:', error);
    return [];
  }
}

export async function fetchPopularKomik(): Promise<KomikItem[]> {
  try {
    const response = await axios.get(`${KOMIK_API}/popular`, {
      params: { provider: 'shinigami' },
      timeout: 15000,
    });
    
    const komikList = response.data?.data || [];
    
    return komikList.map((item: any) => ({
      id: item.href?.split('/').pop() || item.id,
      manga_id: item.href?.split('/').pop() || item.id,
      title: item.title,
      judul: item.title,
      image: item.thumbnail || item.cover_image_url || item.image,
      thumbnail: item.thumbnail,
      cover_image_url: item.thumbnail,
      chapter: item.chapter || '?',
      type: item.type || 'Manhwa',
      status: item.status || 'Ongoing',
    }));
  } catch (error) {
    console.error('Error fetching popular komik:', error);
    return [];
  }
}

export async function fetchKomikDetail(mangaId: string): Promise<KomikItem | null> {
  try {
    const response = await axios.get(`${KOMIK_API}/detail/${mangaId}`, {
      params: { provider: 'shinigami' },
      timeout: 15000,
    });
    
    const data = response.data?.data;
    if (!data) return null;
    
    return {
      id: mangaId,
      manga_id: mangaId,
      title: data.title,
      judul: data.title,
      image: data.thumbnail,
      thumbnail: data.thumbnail,
      cover_image_url: data.thumbnail,
      description: data.description,
      synopsis: data.description,
      status: data.status,
      author: data.author,
      genres: (data.genre || []).map((g: any) => typeof g === 'string' ? g : g.title),
    };
  } catch (error) {
    console.error('Error fetching komik detail:', error);
    return null;
  }
}

export async function searchKomik(query: string): Promise<KomikItem[]> {
  try {
    const response = await axios.get(`${KOMIK_API}/search`, {
      params: { provider: 'shinigami', q: query },
      timeout: 15000,
    });
    
    const komikList = response.data?.data || [];
    
    return komikList.map((item: any) => ({
      id: item.href?.split('/').pop() || item.id,
      manga_id: item.href?.split('/').pop() || item.id,
      title: item.title,
      judul: item.title,
      image: item.thumbnail || item.cover_image_url || item.image,
      thumbnail: item.thumbnail,
      cover_image_url: item.thumbnail,
      chapter: item.chapter || '?',
      type: item.type || 'Manhwa',
    }));
  } catch (error) {
    console.error('Error searching komik:', error);
    return [];
  }
}

// Hentai API Service (Hanime)
export async function fetchRecentHentai(): Promise<HentaiItem[]> {
  try {
    const response = await axios.post(HANIME_SEARCH_API, {
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
    
    const hits = JSON.parse(response.data?.hits || '[]');
    
    return hits.slice(0, 20).map((item: any) => ({
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
        name: item.brand,
        id: item.brand_id,
      },
      tags: item.tags || [],
      rating: item.rating,
    }));
  } catch (error) {
    console.error('Error fetching recent hentai:', error);
    return [];
  }
}

export async function searchHentai(query: string): Promise<HentaiItem[]> {
  try {
    const response = await axios.post(HANIME_SEARCH_API, {
      blacklist: [],
      brands: [],
      order_by: 'created_at_unix',
      page: 0,
      tags: [],
      search_text: query,
      tags_mode: 'AND',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    
    const hits = JSON.parse(response.data?.hits || '[]');
    
    return hits.slice(0, 20).map((item: any) => ({
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
        name: item.brand,
        id: item.brand_id,
      },
      tags: item.tags || [],
      rating: item.rating,
    }));
  } catch (error) {
    console.error('Error searching hentai:', error);
    return [];
  }
}

// Get random image from category
export async function getRandomImage(category: 'anime' | 'komik' | 'hentai'): Promise<ImageResult | null> {
  try {
    let items: any[] = [];
    
    switch (category) {
      case 'anime':
        const [latest, popular, trending] = await Promise.all([
          fetchLatestAnime(),
          fetchPopularAnime(),
          fetchTrendingAnime(),
        ]);
        items = [...latest, ...popular, ...trending];
        break;
      
      case 'komik':
        const [latestKomik, popularKomik] = await Promise.all([
          fetchLatestKomik(),
          fetchPopularKomik(),
        ]);
        items = [...latestKomik, ...popularKomik];
        break;
      
      case 'hentai':
        items = await fetchRecentHentai();
        break;
    }
    
    if (items.length === 0) return null;
    
    // Pick random item
    const randomIndex = Math.floor(Math.random() * items.length);
    const item = items[randomIndex];
    
    // Get image URL based on category
    let imageUrl = '';
    let title = '';
    let description = '';
    
    if (category === 'anime') {
      imageUrl = item.image || item.thumbnail_url || item.poster || '';
      title = item.title || item.judul || '';
      description = item.description || '';
    } else if (category === 'komik') {
      imageUrl = item.image || item.thumbnail || item.cover_image_url || '';
      title = item.title || item.judul || '';
      description = item.description || item.synopsis || '';
    } else {
      imageUrl = item.coverImage || item.cover_url || item.poster_url || item.bannerImage || '';
      title = item.name || '';
      description = item.description || '';
    }
    
    if (!imageUrl) return null;
    
    return {
      url: imageUrl,
      title,
      description,
      source: category,
      originalData: item,
    };
  } catch (error) {
    console.error('Error getting random image:', error);
    return null;
  }
}

// Fetch all categories for dashboard
export async function fetchAllCategories() {
  try {
    const [anime, komik, hentai] = await Promise.all([
      fetchLatestAnime(),
      fetchLatestKomik(),
      fetchRecentHentai(),
    ]);
    
    return {
      anime: anime.slice(0, 10),
      komik: komik.slice(0, 10),
      hentai: hentai.slice(0, 10),
    };
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return {
      anime: [],
      komik: [],
      hentai: [],
    };
  }
}
