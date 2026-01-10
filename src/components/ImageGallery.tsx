'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, Send, Wand2, Eye, Download } from 'lucide-react';
import { ImageResult, AnimeItem, KomikItem, HentaiItem } from '@/types';
import { CaptionStyle } from '@/lib/groq';
import toast from 'react-hot-toast';

interface ImageCardProps {
  item: AnimeItem | KomikItem | HentaiItem;
  category: 'anime' | 'komik' | 'hentai';
  onSelect: (item: any) => void;
  selected?: boolean;
}

export function ImageCard({ item, category, onSelect, selected }: ImageCardProps) {
  const getImageUrl = () => {
    if (category === 'anime') {
      const animeItem = item as AnimeItem;
      return animeItem.image || animeItem.thumbnail_url || animeItem.poster || '';
    } else if (category === 'komik') {
      const komikItem = item as KomikItem;
      return komikItem.image || komikItem.thumbnail || komikItem.cover_image_url || '';
    } else {
      const hentaiItem = item as HentaiItem;
      return hentaiItem.coverImage || hentaiItem.cover_url || hentaiItem.poster_url || '';
    }
  };

  const getTitle = () => {
    if (category === 'anime') {
      return (item as AnimeItem).title || (item as AnimeItem).judul || '';
    } else if (category === 'komik') {
      return (item as KomikItem).title || (item as KomikItem).judul || '';
    } else {
      return (item as HentaiItem).name || '';
    }
  };

  const imageUrl = getImageUrl();
  const title = getTitle();

  return (
    <div 
      onClick={() => onSelect(item)}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer card-hover
        ${selected ? 'ring-2 ring-anime-pink' : 'ring-1 ring-white/10'}
      `}
    >
      <div className="aspect-[3/4] relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-anime-darker flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-medium line-clamp-2">{title}</p>
          <span className={`
            inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium
            ${category === 'anime' ? 'bg-anime-pink/20 text-anime-pink' :
              category === 'komik' ? 'bg-anime-purple/20 text-anime-purple' :
              'bg-red-500/20 text-red-400'}
          `}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-anime-pink rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

interface ImageGalleryProps {
  items: (AnimeItem | KomikItem | HentaiItem)[];
  category: 'anime' | 'komik' | 'hentai';
  onSelect: (item: any) => void;
  selectedId?: string | number;
  loading?: boolean;
}

export function ImageGallery({ items, category, onSelect, selectedId, loading }: ImageGalleryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-anime-darker animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No images found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => {
        const id = category === 'hentai' ? (item as HentaiItem).id : (item as AnimeItem | KomikItem).id;
        return (
          <ImageCard
            key={id}
            item={item}
            category={category}
            onSelect={onSelect}
            selected={selectedId === id}
          />
        );
      })}
    </div>
  );
}

interface SelectedImagePreviewProps {
  imageUrl: string;
  title: string;
  category: 'anime' | 'komik' | 'hentai';
  caption: string;
  onCaptionChange: (caption: string) => void;
  onGenerateCaption: () => void;
  onPost: () => void;
  captionStyle: CaptionStyle;
  onStyleChange: (style: CaptionStyle) => void;
  isGenerating?: boolean;
  isPosting?: boolean;
}

export function SelectedImagePreview({
  imageUrl,
  title,
  category,
  caption,
  onCaptionChange,
  onGenerateCaption,
  onPost,
  captionStyle,
  onStyleChange,
  isGenerating,
  isPosting
}: SelectedImagePreviewProps) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Preview Post</h3>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image Preview */}
        <div className="lg:w-1/3">
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-anime-darker">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-500">Select an image</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">{title}</p>
        </div>
        
        {/* Caption Editor */}
        <div className="lg:w-2/3 space-y-4">
          {/* Style Selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Caption Style</label>
            <div className="flex flex-wrap gap-2">
              {(['formal', 'casual', 'otaku', 'meme'] as CaptionStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => onStyleChange(style)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${captionStyle === style 
                      ? 'bg-anime-pink text-white' 
                      : 'bg-anime-darker text-gray-400 hover:bg-anime-dark'
                    }
                  `}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Caption Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Enter or generate caption..."
              className="input-field w-full h-40 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {caption.length} characters
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onGenerateCaption}
              disabled={!imageUrl || isGenerating}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Generate Caption
                </>
              )}
            </button>
            
            <button
              onClick={onPost}
              disabled={!imageUrl || !caption || isPosting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isPosting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Post Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
