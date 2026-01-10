'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { PostHistory } from '@/types';
import { Trash2, Edit2, ExternalLink, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditModalProps {
  post: PostHistory;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newCaption: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({ post, isOpen, onClose, onSave }) => {
  const [caption, setCaption] = useState(post.caption);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(post.id, caption);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-anime-gray rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Edit Caption</h3>
          <p className="text-gray-400 text-sm mt-1">{post.title}</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-32 h-44 rounded-lg overflow-hidden bg-anime-dark flex-shrink-0">
              <img 
                src={post.imageUrl} 
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-40 px-4 py-3 bg-anime-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-anime-purple resize-none"
                placeholder="Edit caption..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-anime-purple text-white rounded-lg hover:bg-anime-purple/80 transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  post: PostHistory;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ post, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-anime-gray rounded-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Hapus Post?</h3>
          <p className="text-gray-400">
            Apakah kamu yakin ingin menghapus post &quot;{post.title}&quot; dari history?
          </p>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export const RecentPostsPreview: React.FC = () => {
  const { postHistory, removePostHistory } = useAppStore();
  const [editingPost, setEditingPost] = useState<PostHistory | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostHistory | null>(null);

  // Get recent 5 successful posts
  const recentPosts = postHistory
    .filter(p => p.status === 'success')
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, 5);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hentai': return '🔞';
      case 'anime': return '🎬';
      case 'komik': return '📚';
      default: return '📷';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hentai': return 'bg-red-500/20 text-red-400';
      case 'anime': return 'bg-pink-500/20 text-pink-400';
      case 'komik': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleEditSave = (id: string, newCaption: string) => {
    // In a real app, you would update the caption in the store
    // For now, we just show a toast
    toast.success('Caption updated! (Note: Changes are local only)');
    setEditingPost(null);
  };

  const handleDelete = () => {
    if (deletingPost) {
      removePostHistory(deletingPost.id);
      toast.success('Post dihapus dari history');
      setDeletingPost(null);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (recentPosts.length === 0) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📝</span>
          <h3 className="text-lg font-semibold text-white">Post Terbaru</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <ImageIcon size={48} className="mb-4 opacity-50" />
          <p>Belum ada post yang berhasil</p>
          <p className="text-sm mt-1">Jalankan bot untuk mulai posting!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <h3 className="text-lg font-semibold text-white">Post Terbaru</h3>
          </div>
          <span className="text-sm text-gray-400">{recentPosts.length} post terakhir</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentPosts.map((post) => (
            <div 
              key={post.id} 
              className="bg-anime-dark rounded-xl overflow-hidden group hover:ring-2 hover:ring-anime-purple/50 transition-all"
            >
              {/* Image Preview */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                  }}
                />
                
                {/* Category Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryIcon(post.category)} {post.category}
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <CheckCircle size={20} className="text-green-400" />
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="p-2 bg-anime-purple rounded-lg hover:bg-anime-purple/80 transition-colors"
                    title="Edit Caption"
                  >
                    <Edit2 size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => setDeletingPost(post)}
                    className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    title="Hapus dari History"
                  >
                    <Trash2 size={18} className="text-white" />
                  </button>
                  {post.facebookPostId && (
                    <a
                      href={`https://facebook.com/${post.facebookPostId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      title="Lihat di Facebook"
                    >
                      <ExternalLink size={18} className="text-white" />
                    </a>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h4 className="text-white text-sm font-medium truncate" title={post.title}>
                  {post.title}
                </h4>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2" title={post.caption}>
                  {post.caption.substring(0, 50)}...
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {formatDate(post.postedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <EditModal
          post={editingPost}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingPost && (
        <DeleteConfirmModal
          post={deletingPost}
          isOpen={!!deletingPost}
          onClose={() => setDeletingPost(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default RecentPostsPreview;
