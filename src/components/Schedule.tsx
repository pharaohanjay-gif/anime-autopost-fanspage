'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Send, 
  Image as ImageIcon,
  Plus,
  X,
  Check
} from 'lucide-react';
import { ScheduledPost } from '@/types';
import toast from 'react-hot-toast';

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  caption: string;
  onSchedule: (date: Date) => void;
}

export function SchedulePostModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  caption,
  onSchedule
}: SchedulePostModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  if (!isOpen) return null;

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledDate = new Date(`${selectedDate}T${selectedTime}`);
    if (scheduledDate <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    onSchedule(scheduledDate);
    onClose();
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6">Schedule Post</h3>
        
        {/* Preview */}
        <div className="flex gap-4 mb-6 p-4 bg-anime-darker rounded-lg">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-20 h-28 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium line-clamp-1">{title}</p>
            <p className="text-gray-400 text-sm line-clamp-3 mt-1">{caption}</p>
          </div>
        </div>
        
        {/* Date & Time Picker */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Calendar size={14} className="inline mr-1" />
              Date
            </label>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Clock size={14} className="inline mr-1" />
              Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSchedule} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Calendar size={18} />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

interface ScheduledPostCardProps {
  post: ScheduledPost;
  onDelete: (id: string) => void;
  onPostNow: (post: ScheduledPost) => void;
}

export function ScheduledPostCard({ post, onDelete, onPostNow }: ScheduledPostCardProps) {
  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    posted: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="glass rounded-xl p-4 card-hover">
      <div className="flex gap-4">
        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-medium line-clamp-1">{post.title}</p>
              <span className={`
                inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium border
                ${statusColors[post.status]}
              `}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            </div>
            <span className={`
              px-2 py-0.5 rounded text-xs font-medium
              ${post.category === 'anime' ? 'bg-anime-pink/20 text-anime-pink' :
                post.category === 'komik' ? 'bg-anime-purple/20 text-anime-purple' :
                'bg-red-500/20 text-red-400'}
            `}>
              {post.category}
            </span>
          </div>
          
          <p className="text-gray-400 text-sm line-clamp-2 mb-2">
            {post.generatedCaption}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              {format(new Date(post.scheduledTime), 'dd MMM yyyy, HH:mm', { locale: id })}
            </div>
            
            <div className="flex gap-2">
              {post.status === 'pending' && (
                <button
                  onClick={() => onPostNow(post)}
                  className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  title="Post Now"
                >
                  <Send size={14} />
                </button>
              )}
              <button
                onClick={() => onDelete(post.id)}
                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {post.status === 'failed' && post.errorMessage && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs">{post.errorMessage}</p>
        </div>
      )}
    </div>
  );
}

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  onDelete: (id: string) => void;
  onPostNow: (post: ScheduledPost) => void;
}

export function ScheduledPostsList({ posts, onDelete, onPostNow }: ScheduledPostsListProps) {
  const pendingPosts = posts.filter(p => p.status === 'pending');
  const completedPosts = posts.filter(p => p.status === 'posted');
  const failedPosts = posts.filter(p => p.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pendingPosts.length}</p>
          <p className="text-xs text-gray-400">Pending</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{completedPosts.length}</p>
          <p className="text-xs text-gray-400">Posted</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{failedPosts.length}</p>
          <p className="text-xs text-gray-400">Failed</p>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">No scheduled posts</p>
          <p className="text-sm text-gray-500 mt-1">
            Select an image and schedule it for posting
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
            .map((post) => (
              <ScheduledPostCard
                key={post.id}
                post={post}
                onDelete={onDelete}
                onPostNow={onPostNow}
              />
            ))}
        </div>
      )}
    </div>
  );
}
