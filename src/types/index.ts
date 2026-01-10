// Types untuk API Response dan Data

export interface AnimeItem {
  id: string;
  urlId?: string;
  title: string;
  judul?: string;
  image: string;
  thumbnail_url?: string;
  poster?: string;
  cover?: string;
  cover_image_url?: string;
  episode?: string;
  rating?: string;
  score?: string;
  type?: string;
  description?: string;
  synopsis?: string;
  genres?: string[];
  status?: string;
}

export interface KomikItem {
  id: string;
  manga_id?: string;
  title: string;
  judul?: string;
  image: string;
  thumbnail?: string;
  cover_image_url?: string;
  cover?: string;
  chapter?: string;
  type?: string;
  status?: string;
  description?: string;
  synopsis?: string;
  author?: string;
  genres?: string[];
}

export interface HentaiItem {
  id: number;
  name: string;
  titles?: string[];
  slug: string;
  description?: string;
  views?: number;
  bannerImage?: string;
  coverImage?: string;
  cover_url?: string;
  poster_url?: string;
  brand?: {
    name: string;
    id: number | string;
  };
  tags?: string[];
  rating?: number;
}

export interface ScheduledPost {
  id: string;
  category: 'anime' | 'komik' | 'hentai';
  imageUrl: string;
  title: string;
  description: string;
  generatedCaption: string;
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed';
  createdAt: Date;
  postedAt?: Date;
  errorMessage?: string;
}

export interface PostCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface BotSettings {
  fbPageId: string;
  fbAccessToken: string;
  autoPostEnabled: boolean;
  postInterval: number; // dalam menit
  maxPostsPerDay: number;
  enabledCategories: string[];
  captionStyle: 'formal' | 'casual' | 'otaku' | 'meme' | 'jaksel';
  includeHashtags: boolean;
  customHashtags: string[];
}

// Post History untuk tracking
export interface PostHistory {
  id: string;
  category: 'anime' | 'komik' | 'hentai';
  imageUrl: string;
  title: string;
  caption: string;
  status: 'success' | 'failed';
  error?: string;
  facebookPostId?: string;
  postedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ImageResult {
  url: string;
  title: string;
  description?: string;
  source: 'anime' | 'komik' | 'hentai';
  originalData: AnimeItem | KomikItem | HentaiItem;
}

export interface GroqResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}
