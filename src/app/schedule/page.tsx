'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { ScheduledPostsList } from '@/components/Schedule';
import { useAppStore } from '@/lib/store';
import { ScheduledPost } from '@/types';
import toast from 'react-hot-toast';

export default function SchedulePage() {
  const { 
    scheduledPosts, 
    removeScheduledPost,
    updateScheduledPost,
    settings,
    incrementTotalPosts,
    incrementSuccessfulPosts,
    incrementFailedPosts
  } = useAppStore();

  const handleDelete = (id: string) => {
    removeScheduledPost(id);
    toast.success('Post removed from schedule');
  };

  const handlePostNow = async (post: ScheduledPost) => {
    if (!settings.fbPageId || !settings.fbAccessToken) {
      toast.error('Please configure Facebook settings first');
      return;
    }

    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'post-now',
          postData: {
            pageId: settings.fbPageId,
            accessToken: settings.fbAccessToken,
            imageUrl: post.imageUrl,
            caption: post.generatedCaption,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        updateScheduledPost(post.id, { 
          status: 'posted', 
          postedAt: new Date() 
        });
        toast.success('Posted successfully!');
        incrementTotalPosts();
        incrementSuccessfulPosts();
      } else {
        updateScheduledPost(post.id, { 
          status: 'failed', 
          errorMessage: data.error 
        });
        toast.error(data.error || 'Failed to post');
        incrementTotalPosts();
        incrementFailedPosts();
      }
    } catch (error) {
      updateScheduledPost(post.id, { 
        status: 'failed', 
        errorMessage: 'Network error' 
      });
      toast.error('Failed to post');
      incrementTotalPosts();
      incrementFailedPosts();
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Scheduled Posts</h1>
          <p className="text-gray-400 mt-1">
            Manage your scheduled anime posts
          </p>
        </div>

        <ScheduledPostsList
          posts={scheduledPosts}
          onDelete={handleDelete}
          onPostNow={handlePostNow}
        />
      </div>
    </Layout>
  );
}
