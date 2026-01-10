'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image, 
  Calendar, 
  Settings, 
  Bot,
  Sparkles,
  History
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${isActive 
          ? 'bg-gradient-to-r from-anime-pink/20 to-anime-purple/20 text-white border border-anime-pink/30' 
          : 'text-gray-400 hover:text-white hover:bg-anime-dark'
        }
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/browse', icon: <Image size={20} />, label: 'Browse Images' },
    { href: '/schedule', icon: <Calendar size={20} />, label: 'Schedule' },
    { href: '/history', icon: <History size={20} />, label: 'Riwayat' },
    { href: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-anime-darker border-r border-anime-purple/20 p-4 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-anime-pink to-anime-purple flex items-center justify-center">
          <Bot size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white">AnimePost</h1>
          <p className="text-xs text-gray-500">Auto Poster Bot</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="glass rounded-xl p-4 mt-auto">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-anime-pink" />
          <span className="text-sm font-medium text-white">Pro Tip</span>
        </div>
        <p className="text-xs text-gray-400">
          Set up your Facebook Page token to start auto-posting anime content!
        </p>
      </div>
    </aside>
  );
}

export function Header() {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/browse': return 'Browse Images';
      case '/schedule': return 'Scheduled Posts';
      case '/history': return 'Riwayat Posting';
      case '/settings': return 'Settings';
      default: return 'AnimePost Bot';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-anime-darker/80 backdrop-blur-lg border-b border-anime-purple/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold gradient-text">{getPageTitle()}</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Anime Auto Post</p>
            <p className="text-xs text-gray-500">Facebook Fanspage Bot</p>
          </div>
        </div>
      </div>
    </header>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-anime-darker">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
