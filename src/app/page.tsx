'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { DashboardStats, BotStatus } from '@/components/Dashboard';
import { ImageCard } from '@/components/ImageGallery';
import { RecentPostsPreview } from '@/components/RecentPostsPreview';
import { useAppStore } from '@/lib/store';
import { fetchAllCategories } from '@/lib/api';
import { AnimeItem, KomikItem, HentaiItem } from '@/types';
import { RefreshCw, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Home() {
  const { 
    settings, 
    scheduledPosts,
    isRunning, 
    setIsRunning,
    totalPosts,
    successfulPosts,
    failedPosts,
    incrementTotalPosts,
    incrementSuccessfulPosts,
    incrementFailedPosts
  } = useAppStore();

  const [recentImages, setRecentImages] = useState<{
    anime: AnimeItem[];
    komik: KomikItem[];
    hentai: HentaiItem[];
  }>({
    anime: [],
    komik: [],
    hentai: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastPostTime, setLastPostTime] = useState<Date | undefined>();
  const [nextPostTime, setNextPostTime] = useState<Date | undefined>();

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (isRunning && settings.postInterval) {
      const now = new Date();
      setNextPostTime(new Date(now.getTime() + settings.postInterval * 60 * 1000));
    } else {
      setNextPostTime(undefined);
    }
  }, [isRunning, settings.postInterval]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCategories();
      setRecentImages(data);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    }
    setLoading(false);
  };

  const handleAutoPost = async () => {
    try {
      toast.loading('Posting otomatis...', { id: 'autopost' });
      
      const response = await fetch('/api/cron/auto-post', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Berhasil post: ${data.title}`, { id: 'autopost' });
        incrementTotalPosts();
        incrementSuccessfulPosts();
        setLastPostTime(new Date());
        // Reload to show latest
        loadImages();
      } else {
        toast.error(data.error || 'Gagal auto post', { id: 'autopost' });
        incrementTotalPosts();
        incrementFailedPosts();
      }
    } catch (error) {
      toast.error('Gagal auto post', { id: 'autopost' });
      incrementTotalPosts();
      incrementFailedPosts();
    }
  };

  const handleToggleBot = async () => {
    // Manual trigger auto post instead of old bot system
    await handleAutoPost();
  };

  const pendingPosts = scheduledPosts.filter(p => p.status === 'pending').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome Back! 👋</h1>
            <p className="text-gray-400 mt-1">Manage your anime auto-posting bot</p>
          </div>
          <button
            onClick={loadImages}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <DashboardStats
          totalPosts={totalPosts}
          successfulPosts={successfulPosts}
          failedPosts={failedPosts}
          scheduledPosts={pendingPosts}
          isRunning={isRunning}
        />

        {/* Bot Status & Quick Post */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BotStatus
            isRunning={isRunning}
            onToggle={handleToggleBot}
            lastPostTime={lastPostTime}
            nextPostTime={nextPostTime}
          />

          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/browse"
                className="flex items-center gap-3 p-4 bg-anime-dark rounded-xl hover:bg-anime-purple/20 transition-all border border-transparent hover:border-anime-purple/30"
              >
                <div className="w-10 h-10 rounded-lg bg-anime-pink/20 flex items-center justify-center text-anime-pink">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-white font-medium">Quick Post</p>
                  <p className="text-xs text-gray-400">Post instantly</p>
                </div>
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-3 p-4 bg-anime-dark rounded-xl hover:bg-anime-purple/20 transition-all border border-transparent hover:border-anime-purple/30"
              >
                <div className="w-10 h-10 rounded-lg bg-anime-purple/20 flex items-center justify-center text-anime-purple">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <p className="text-white font-medium">Riwayat</p>
                  <p className="text-xs text-gray-400">Lihat semua post</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Posts Preview */}
        <RecentPostsPreview />

        {/* Recent Content Preview */}
        <div className="space-y-6">
          {/* Anime Section */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎬</span>
                <h3 className="text-lg font-semibold text-white">Latest Anime</h3>
              </div>
              <Link href="/browse?category=anime" className="text-anime-pink text-sm hover:underline">
                View All →
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-anime-dark animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentImages.anime.slice(0, 5).map((item) => (
                  <ImageCard
                    key={item.id}
                    item={item}
                    category="anime"
                    onSelect={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Komik Section */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <h3 className="text-lg font-semibold text-white">Latest Manga/Manhwa</h3>
              </div>
              <Link href="/browse?category=komik" className="text-anime-purple text-sm hover:underline">
                View All →
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-anime-dark animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentImages.komik.slice(0, 5).map((item) => (
                  <ImageCard
                    key={item.id}
                    item={item}
                    category="komik"
                    onSelect={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Hentai Section */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔞</span>
                <h3 className="text-lg font-semibold text-white">Hentai (18+)</h3>
              </div>
              <Link href="/browse?category=hentai" className="text-red-400 text-sm hover:underline">
                View All →
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-anime-dark animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentImages.hentai.slice(0, 5).map((item) => (
                  <ImageCard
                    key={item.id}
                    item={item}
                    category="hentai"
                    onSelect={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
