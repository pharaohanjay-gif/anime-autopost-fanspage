'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { Trash2, CheckCircle2, XCircle, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function HistoryPage() {
  const { postHistory, removePostHistory, clearHistory } = useAppStore();

  const handleDelete = (id: string) => {
    removePostHistory(id);
    toast.success('Item dihapus dari riwayat');
  };

  const handleClearAll = () => {
    if (confirm('Yakin mau hapus semua riwayat?')) {
      clearHistory();
      toast.success('Semua riwayat dihapus');
    }
  };

  const successPosts = postHistory.filter(p => p.status === 'success');
  const failedPosts = postHistory.filter(p => p.status === 'failed');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Riwayat Posting</h1>
            <p className="text-gray-400 mt-1">
              Track semua postingan yang berhasil dan gagal
            </p>
          </div>
          {postHistory.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn-secondary flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <Trash2 size={18} />
              Hapus Semua
            </button>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{successPosts.length}</p>
              <p className="text-sm text-gray-400">Berhasil</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{failedPosts.length}</p>
              <p className="text-sm text-gray-400">Gagal</p>
            </div>
          </div>
        </div>

        {/* History List */}
        {postHistory.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Clock className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">Belum ada riwayat posting</p>
            <p className="text-sm text-gray-500 mt-1">
              Riwayat akan muncul setelah bot mulai posting
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {postHistory.map((post) => (
              <div
                key={post.id}
                className={`glass rounded-xl p-4 border-l-4 ${
                  post.status === 'success' ? 'border-l-green-500' : 'border-l-red-500'
                }`}
              >
                <div className="flex gap-4">
                  {/* Image Preview */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-anime-darker flex-shrink-0">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-medium truncate">{post.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            post.category === 'anime' ? 'bg-anime-pink/20 text-anime-pink' :
                            post.category === 'komik' ? 'bg-anime-purple/20 text-anime-purple' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {post.category}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${
                            post.status === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {post.status === 'success' ? (
                              <><CheckCircle2 size={12} /> Berhasil</>
                            ) : (
                              <><XCircle size={12} /> Gagal</>
                            )}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{post.caption}</p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {format(new Date(post.postedAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </span>
                      {post.status === 'success' && post.facebookPostId && (
                        <a
                          href={`https://facebook.com/${post.facebookPostId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-anime-purple hover:text-anime-pink"
                        >
                          <ExternalLink size={12} />
                          Lihat di Facebook
                        </a>
                      )}
                      {post.status === 'failed' && post.error && (
                        <span className="text-xs text-red-400">{post.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
