'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { ImageGallery, SelectedImagePreview } from '@/components/ImageGallery';
import { SchedulePostModal } from '@/components/Schedule';
import { useAppStore } from '@/lib/store';
import { 
  fetchLatestAnime, 
  fetchPopularAnime, 
  fetchTrendingAnime,
  fetchLatestKomik,
  fetchPopularKomik,
  fetchRecentHentai,
  searchAnime,
  searchKomik,
  searchHentai,
  getRandomImage
} from '@/lib/api';
import { AnimeItem, KomikItem, HentaiItem, ScheduledPost } from '@/types';
import { CaptionStyle } from '@/lib/groq';
import { RefreshCw, Search, Shuffle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

type Category = 'anime' | 'komik' | 'hentai';
type ContentType = 'latest' | 'popular' | 'trending';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('category') as Category) || 'anime';
  
  const { 
    settings, 
    categories,
    addScheduledPost,
    addPostHistory,
    addPostedImageUrl,
    incrementTotalPosts,
    incrementSuccessfulPosts,
    incrementFailedPosts
  } = useAppStore();

  const [category, setCategory] = useState<Category>(initialCategory);
  const [contentType, setContentType] = useState<ContentType>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<(AnimeItem | KomikItem | HentaiItem)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('jaksel'); // Default to Jaksel
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    loadContent();
  }, [category, contentType]);

  const loadContent = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      
      switch (category) {
        case 'anime':
          if (contentType === 'popular') {
            data = await fetchPopularAnime();
          } else if (contentType === 'trending') {
            data = await fetchTrendingAnime();
          } else {
            data = await fetchLatestAnime();
          }
          break;
        
        case 'komik':
          if (contentType === 'popular') {
            data = await fetchPopularKomik();
          } else {
            data = await fetchLatestKomik();
          }
          break;
        
        case 'hentai':
          data = await fetchRecentHentai();
          break;
      }
      
      setItems(data);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadContent();
      return;
    }

    setLoading(true);
    try {
      let data: any[] = [];
      
      switch (category) {
        case 'anime':
          data = await searchAnime(searchQuery);
          break;
        case 'komik':
          data = await searchKomik(searchQuery);
          break;
        case 'hentai':
          data = await searchHentai(searchQuery);
          break;
      }
      
      setItems(data);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    }
    setLoading(false);
  };

  const handleRandomImage = async () => {
    setLoading(true);
    try {
      const result = await getRandomImage(category);
      if (result) {
        setSelectedItem(result.originalData);
        setCaption('');
        toast.success(`Random ${category} selected!`);
      } else {
        toast.error('No images found');
      }
    } catch (error) {
      toast.error('Failed to get random image');
    }
    setLoading(false);
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setCaption('');
  };

  const getSelectedImageUrl = () => {
    if (!selectedItem) return '';
    
    if (category === 'anime') {
      return selectedItem.image || selectedItem.thumbnail_url || selectedItem.poster || '';
    } else if (category === 'komik') {
      return selectedItem.image || selectedItem.thumbnail || selectedItem.cover_image_url || '';
    } else {
      const rawUrl = selectedItem.coverImage || selectedItem.cover_url || selectedItem.poster_url || '';
      // Proxy hentai images to avoid hotlink protection
      if (rawUrl) {
        return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
      }
      return '';
    }
  };

  // Get raw image URL (without proxy) for Facebook posting
  const getRawImageUrl = () => {
    if (!selectedItem) return '';
    
    if (category === 'anime') {
      return selectedItem.image || selectedItem.thumbnail_url || selectedItem.poster || '';
    } else if (category === 'komik') {
      return selectedItem.image || selectedItem.thumbnail || selectedItem.cover_image_url || '';
    } else {
      return selectedItem.coverImage || selectedItem.cover_url || selectedItem.poster_url || '';
    }
  };

  const getSelectedTitle = () => {
    if (!selectedItem) return '';
    
    if (category === 'hentai') {
      return selectedItem.name || '';
    }
    return selectedItem.title || selectedItem.judul || '';
  };

  const handleGenerateCaption = async () => {
    if (!selectedItem) {
      toast.error('Please select an image first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: getSelectedTitle(),
          description: selectedItem.description || selectedItem.synopsis || '',
          imageUrl: getSelectedImageUrl(),
          category,
          style: captionStyle,
          includeHashtags: settings.includeHashtags,
          customHashtags: settings.customHashtags,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCaption(data.data.caption);
        toast.success('Caption generated!');
      } else {
        toast.error(data.error || 'Failed to generate caption');
      }
    } catch (error) {
      toast.error('Failed to generate caption');
    }
    setIsGenerating(false);
  };

  const handlePost = async () => {
    if (!selectedItem || !caption) {
      toast.error('Please select an image and generate a caption');
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'post-now',
          postData: {
            imageUrl: getRawImageUrl(), // Use raw URL for Facebook
            caption,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Posted to Weebnesia successfully! 🎉');
        
        // Save to client-side history
        addPostHistory({
          id: `history_${Date.now()}`,
          category,
          imageUrl: getRawImageUrl(),
          title: getSelectedTitle(),
          caption,
          status: 'success',
          facebookPostId: data.postId,
          postedAt: new Date(),
        });
        addPostedImageUrl(getRawImageUrl());
        
        incrementTotalPosts();
        incrementSuccessfulPosts();
        setSelectedItem(null);
        setCaption('');
      } else {
        toast.error(data.error || 'Failed to post');
        
        // Save failed attempt to history
        addPostHistory({
          id: `history_${Date.now()}`,
          category,
          imageUrl: getRawImageUrl(),
          title: getSelectedTitle(),
          caption,
          status: 'failed',
          error: data.error,
          postedAt: new Date(),
        });
        
        incrementTotalPosts();
        incrementFailedPosts();
      }
    } catch (error: any) {
      toast.error('Failed to post');
      
      // Save failed attempt to history  
      addPostHistory({
        id: `history_${Date.now()}`,
        category,
        imageUrl: getRawImageUrl(),
        title: getSelectedTitle(),
        caption,
        status: 'failed',
        error: error.message || 'Network error',
        postedAt: new Date(),
      });
      
      incrementTotalPosts();
      incrementFailedPosts();
    }
    setIsPosting(false);
  };

  const handleSchedule = (scheduledDate: Date) => {
    if (!selectedItem || !caption) {
      toast.error('Please select an image and generate a caption');
      return;
    }

    const newPost: ScheduledPost = {
      id: `post_${Date.now()}`,
      category,
      imageUrl: getRawImageUrl(), // Use raw URL for Facebook
      title: getSelectedTitle(),
      description: selectedItem.description || '',
      generatedCaption: caption,
      scheduledTime: scheduledDate,
      status: 'pending',
      createdAt: new Date(),
    };

    addScheduledPost(newPost);
    toast.success('Post scheduled!');
    setShowScheduleModal(false);
    setSelectedItem(null);
    setCaption('');
  };

  const getSelectedId = () => {
    if (!selectedItem) return undefined;
    return category === 'hentai' ? selectedItem.id : selectedItem.id;
  };

  const categoryTabs = [
    { id: 'anime', label: 'Anime', icon: '🎬' },
    { id: 'komik', label: 'Manga/Manhwa', icon: '📚' },
    { id: 'hentai', label: 'Hentai (18+)', icon: '🔞' },
  ];

  const typeTabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'popular', label: 'Popular' },
    ...(category === 'anime' ? [{ id: 'trending', label: 'Trending' }] : []),
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Category Tabs */}
        <div className="flex items-center gap-4 flex-wrap">
          {categoryTabs.map((tab) => {
            const isEnabled = categories.find(c => c.id === tab.id)?.enabled;
            if (tab.id === 'hentai' && !isEnabled) return null;
            
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as Category)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
                  ${category === tab.id 
                    ? 'bg-gradient-to-r from-anime-pink to-anime-purple text-white' 
                    : 'bg-anime-dark text-gray-400 hover:text-white border border-gray-700'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="glass rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Search ${category}...`}
                className="input-field w-full pl-10"
              />
            </div>

            {/* Type Tabs */}
            <div className="flex gap-2">
              {typeTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setContentType(tab.id as ContentType)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${contentType === tab.id 
                      ? 'bg-anime-pink/20 text-anime-pink border border-anime-pink/30' 
                      : 'bg-anime-darker text-gray-400 hover:text-white border border-gray-700'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="btn-secondary flex items-center gap-2"
              >
                <Search size={18} />
                Search
              </button>
              <button
                onClick={handleRandomImage}
                className="btn-primary flex items-center gap-2"
              >
                <Shuffle size={18} />
                Random
              </button>
            </div>
          </div>
        </div>

        {/* Selected Image Preview */}
        {selectedItem && (
          <div className="space-y-4">
            <SelectedImagePreview
              imageUrl={getSelectedImageUrl()}
              title={getSelectedTitle()}
              category={category}
              caption={caption}
              onCaptionChange={setCaption}
              onGenerateCaption={handleGenerateCaption}
              onPost={handlePost}
              captionStyle={captionStyle}
              onStyleChange={setCaptionStyle}
              isGenerating={isGenerating}
              isPosting={isPosting}
            />
            
            {/* Schedule Button */}
            <button
              onClick={() => setShowScheduleModal(true)}
              disabled={!caption}
              className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Calendar size={18} />
              Schedule Post
            </button>
          </div>
        )}

        {/* Image Gallery */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {searchQuery ? 'Search Results' : `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} ${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </h3>
            <button
              onClick={loadContent}
              disabled={loading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <ImageGallery
            items={items}
            category={category}
            onSelect={handleSelectItem}
            selectedId={getSelectedId()}
            loading={loading}
          />
        </div>

        {/* Schedule Modal */}
        <SchedulePostModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          imageUrl={getSelectedImageUrl()}
          title={getSelectedTitle()}
          caption={caption}
          onSchedule={handleSchedule}
        />
      </div>
    </Layout>
  );
}
