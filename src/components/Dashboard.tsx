'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  Settings, 
  Image as ImageIcon, 
  Calendar, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'pink' | 'purple' | 'blue' | 'green' | 'red';
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue,
  color = 'pink' 
}: StatsCardProps) {
  const colorClasses = {
    pink: 'from-anime-pink/20 to-anime-pink/5 border-anime-pink/30',
    purple: 'from-anime-purple/20 to-anime-purple/5 border-anime-purple/30',
    blue: 'from-anime-blue/20 to-anime-blue/5 border-anime-blue/30',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  };

  const iconColorClasses = {
    pink: 'text-anime-pink',
    purple: 'text-anime-purple',
    blue: 'text-anime-blue',
    green: 'text-green-500',
    red: 'text-red-500',
  };

  return (
    <div className={`
      bg-gradient-to-br ${colorClasses[color]}
      border rounded-xl p-5 card-hover
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && trendValue && (
            <p className={`text-xs mt-1 ${
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-anime-darker ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  totalPosts: number;
  successfulPosts: number;
  failedPosts: number;
  scheduledPosts: number;
  isRunning: boolean;
}

export function DashboardStats({
  totalPosts,
  successfulPosts,
  failedPosts,
  scheduledPosts,
  isRunning
}: DashboardStatsProps) {
  const successRate = totalPosts > 0 
    ? Math.round((successfulPosts / totalPosts) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Posts"
        value={totalPosts}
        icon={<ImageIcon size={24} />}
        color="pink"
        trend="up"
        trendValue="All time"
      />
      <StatsCard
        title="Successful"
        value={successfulPosts}
        icon={<CheckCircle2 size={24} />}
        color="green"
        trend="neutral"
        trendValue={`${successRate}% success rate`}
      />
      <StatsCard
        title="Failed"
        value={failedPosts}
        icon={<XCircle size={24} />}
        color="red"
      />
      <StatsCard
        title="Scheduled"
        value={scheduledPosts}
        icon={<Clock size={24} />}
        color="purple"
      />
    </div>
  );
}

interface BotStatusProps {
  isRunning: boolean;
  onToggle: () => void;
  lastPostTime?: Date;
  nextPostTime?: Date;
}

export function BotStatus({ 
  isRunning, 
  onToggle,
  lastPostTime,
  nextPostTime 
}: BotStatusProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Auto Post</h3>
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gradient-to-r from-anime-pink to-anime-purple text-white hover:opacity-90"
        >
          <Play size={18} />
          Post Sekarang!
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-anime-dark rounded-lg">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <div>
            <p className="text-white font-medium">Vercel Cron Aktif</p>
            <p className="text-gray-400 text-sm">Auto post setiap hari jam 8 pagi WIB</p>
          </div>
        </div>
        
        <div className="p-3 bg-anime-dark rounded-lg">
          <p className="text-gray-400 text-sm mb-2">💡 Mau lebih sering auto post?</p>
          <p className="text-gray-500 text-xs">
            Gunakan <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-anime-pink hover:underline">cron-job.org</a> (gratis) untuk memanggil:
          </p>
          <code className="block mt-2 p-2 bg-anime-darker rounded text-xs text-anime-purple break-all">
            https://botautopost-seven.vercel.app/api/cron/auto-post
          </code>
        </div>
        
        {lastPostTime && (
          <p className="text-gray-400 text-sm">
            Post terakhir: <span className="text-white">{lastPostTime.toLocaleString('id-ID')}</span>
          </p>
        )}
      </div>
    </div>
  );
}
