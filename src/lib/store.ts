import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScheduledPost, BotSettings, PostCategory, PostHistory } from '@/types';

interface AppState {
  // Settings
  settings: BotSettings;
  updateSettings: (settings: Partial<BotSettings>) => void;
  
  // Scheduled Posts
  scheduledPosts: ScheduledPost[];
  addScheduledPost: (post: ScheduledPost) => void;
  updateScheduledPost: (id: string, updates: Partial<ScheduledPost>) => void;
  removeScheduledPost: (id: string) => void;
  
  // Post History
  postHistory: PostHistory[];
  addPostHistory: (post: PostHistory) => void;
  removePostHistory: (id: string) => void;
  clearHistory: () => void;
  
  // Posted Images (untuk anti-duplikat)
  postedImageUrls: string[];
  addPostedImageUrl: (url: string) => void;
  isImagePosted: (url: string) => boolean;
  
  // Posting Rhythm (untuk urutan hentai → anime → komik)
  currentRhythmIndex: number;
  getNextCategory: () => 'hentai' | 'anime' | 'komik';
  advanceRhythm: () => void;
  
  // Categories
  categories: PostCategory[];
  toggleCategory: (categoryId: string) => void;
  
  // Bot Status
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  
  // Stats
  totalPosts: number;
  successfulPosts: number;
  failedPosts: number;
  incrementTotalPosts: () => void;
  incrementSuccessfulPosts: () => void;
  incrementFailedPosts: () => void;
  resetStats: () => void;
}

const defaultSettings: BotSettings = {
  fbPageId: '',
  fbAccessToken: '',
  autoPostEnabled: false,
  postInterval: 60, // 60 minutes default
  maxPostsPerDay: 10,
  enabledCategories: ['anime', 'komik', 'hentai'],
  captionStyle: 'jaksel',
  includeHashtags: true,
  customHashtags: ['AnimeIndonesia', 'WibuNation', 'Weebnesia'],
};

// Rhythm: hentai → anime → komik → repeat
const POSTING_RHYTHM: ('hentai' | 'anime' | 'komik')[] = ['hentai', 'anime', 'komik'];

const defaultCategories: PostCategory[] = [
  {
    id: 'hentai',
    name: 'Hentai (18+)',
    description: 'Konten anime dewasa',
    icon: '🔞',
    enabled: true,
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Sampul dan poster anime populer',
    icon: '🎬',
    enabled: true,
  },
  {
    id: 'komik',
    name: 'Manga/Manhwa',
    description: 'Cover manga dan manhwa terbaru',
    icon: '📚',
    enabled: true,
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Settings
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      // Scheduled Posts
      scheduledPosts: [],
      addScheduledPost: (post) =>
        set((state) => ({
          scheduledPosts: [...state.scheduledPosts, post],
        })),
      updateScheduledPost: (id, updates) =>
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((post) =>
            post.id === id ? { ...post, ...updates } : post
          ),
        })),
      removeScheduledPost: (id) =>
        set((state) => ({
          scheduledPosts: state.scheduledPosts.filter((post) => post.id !== id),
        })),
      
      // Post History
      postHistory: [],
      addPostHistory: (post) =>
        set((state) => ({
          postHistory: [post, ...state.postHistory].slice(0, 100), // Keep last 100
        })),
      removePostHistory: (id) =>
        set((state) => ({
          postHistory: state.postHistory.filter((post) => post.id !== id),
        })),
      clearHistory: () => set({ postHistory: [] }),
      
      // Posted Images (anti-duplikat)
      postedImageUrls: [],
      addPostedImageUrl: (url) =>
        set((state) => ({
          postedImageUrls: [...state.postedImageUrls, url].slice(-500), // Keep last 500
        })),
      isImagePosted: (url) => get().postedImageUrls.includes(url),
      
      // Posting Rhythm
      currentRhythmIndex: 0,
      getNextCategory: () => {
        const index = get().currentRhythmIndex;
        return POSTING_RHYTHM[index % POSTING_RHYTHM.length];
      },
      advanceRhythm: () =>
        set((state) => ({
          currentRhythmIndex: (state.currentRhythmIndex + 1) % POSTING_RHYTHM.length,
        })),
      
      // Categories
      categories: defaultCategories,
      toggleCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
          ),
          settings: {
            ...state.settings,
            enabledCategories: state.categories
              .map((cat) =>
                cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
              )
              .filter((cat) => cat.enabled)
              .map((cat) => cat.id),
          },
        })),
      
      // Bot Status
      isRunning: false,
      setIsRunning: (running) => set({ isRunning: running }),
      
      // Stats
      totalPosts: 0,
      successfulPosts: 0,
      failedPosts: 0,
      incrementTotalPosts: () =>
        set((state) => ({ totalPosts: state.totalPosts + 1 })),
      incrementSuccessfulPosts: () =>
        set((state) => ({ successfulPosts: state.successfulPosts + 1 })),
      incrementFailedPosts: () =>
        set((state) => ({ failedPosts: state.failedPosts + 1 })),
      resetStats: () =>
        set({ totalPosts: 0, successfulPosts: 0, failedPosts: 0 }),
    }),
    {
      name: 'anime-autopost-storage',
      partialize: (state) => ({
        settings: state.settings,
        scheduledPosts: state.scheduledPosts,
        categories: state.categories,
        totalPosts: state.totalPosts,
        successfulPosts: state.successfulPosts,
        failedPosts: state.failedPosts,
        postHistory: state.postHistory,
        postedImageUrls: state.postedImageUrls,
        currentRhythmIndex: state.currentRhythmIndex,
      }),
    }
  )
);
