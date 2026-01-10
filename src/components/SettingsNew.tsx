'use client';

import React, { useState, useEffect } from 'react';
import { Save, Check, AlertCircle, Facebook, RefreshCw } from 'lucide-react';
import { BotSettings, PostCategory } from '@/types';
import { CaptionStyle } from '@/lib/groq';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
  settings: BotSettings;
  categories: PostCategory[];
  onSaveSettings: (settings: BotSettings) => void;
  onToggleCategory: (categoryId: string) => void;
}

export function SettingsPanel({
  settings,
  categories,
  onSaveSettings,
  onToggleCategory,
}: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<BotSettings>(settings);
  const [newHashtag, setNewHashtag] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    pageName: string;
    checking: boolean;
  }>({ connected: false, pageName: '', checking: true });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, checking: true }));
    try {
      const response = await fetch('/api/facebook');
      const data = await response.json();
      setConnectionStatus({
        connected: data.success && data.data?.connected,
        pageName: data.data?.pageName || 'Weebnesia',
        checking: false,
      });
    } catch (error) {
      setConnectionStatus({ connected: false, pageName: '', checking: false });
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    toast.success('Settings saved!');
  };

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.trim().replace('#', '');
      if (!localSettings.customHashtags.includes(tag)) {
        setLocalSettings({
          ...localSettings,
          customHashtags: [...localSettings.customHashtags, tag]
        });
      }
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag: string) => {
    setLocalSettings({
      ...localSettings,
      customHashtags: localSettings.customHashtags.filter(t => t !== tag)
    });
  };

  return (
    <div className="space-y-6">
      {/* Facebook Connection Status - Hardcoded for Weebnesia */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Facebook className="text-blue-500" size={20} />
          Facebook Page
        </h3>
        
        <div className="flex items-center justify-between p-4 bg-dark-lighter rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
            <div>
              <p className="text-white font-medium">Weebnesia</p>
              <p className="text-sm text-gray-400">Page ID: 61585967653974</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus.checking ? (
              <RefreshCw size={18} className="text-gray-400 animate-spin" />
            ) : connectionStatus.connected ? (
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={16} />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-400 text-sm">
                <AlertCircle size={16} />
                Checking...
              </span>
            )}
            <button
              onClick={checkConnection}
              className="p-2 rounded-lg bg-anime-purple/20 text-anime-purple hover:bg-anime-purple/30"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-3">
          ✓ Bot sudah terhubung ke halaman Facebook Weebnesia secara otomatis
        </p>
      </div>

      {/* Bot Settings */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Bot Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-white">Auto Post</label>
              <p className="text-xs text-gray-500">Enable automatic posting</p>
            </div>
            <button
              onClick={() => setLocalSettings({ 
                ...localSettings, 
                autoPostEnabled: !localSettings.autoPostEnabled 
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.autoPostEnabled ? 'bg-anime-purple' : 'bg-dark-lighter'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                localSettings.autoPostEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}></span>
            </button>
          </div>
          
          <div>
            <label className="block text-sm text-white mb-2">Post Interval (minutes)</label>
            <input
              type="number"
              value={localSettings.postInterval}
              onChange={(e) => setLocalSettings({ 
                ...localSettings, 
                postInterval: Math.max(5, Math.min(1440, parseInt(e.target.value) || 60)) 
              })}
              min={5}
              max={1440}
              className="input-field w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 5 minutes, Maximum 1440 minutes (24 hours)
            </p>
          </div>
          
          <div>
            <label className="block text-sm text-white mb-2">Max Posts Per Day</label>
            <input
              type="number"
              value={localSettings.maxPostsPerDay}
              onChange={(e) => setLocalSettings({ 
                ...localSettings, 
                maxPostsPerDay: Math.max(1, parseInt(e.target.value) || 10) 
              })}
              min={1}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Caption Settings */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Caption Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white mb-2">Caption Style</label>
            <div className="flex flex-wrap gap-2">
              {(['formal', 'casual', 'otaku', 'meme'] as CaptionStyle[]).map(style => (
                <button
                  key={style}
                  onClick={() => setLocalSettings({ ...localSettings, captionStyle: style })}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    localSettings.captionStyle === style
                      ? 'bg-anime-purple text-white'
                      : 'bg-dark-lighter text-gray-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-white">Include Hashtags</label>
              <p className="text-xs text-gray-500">Add hashtags to captions</p>
            </div>
            <button
              onClick={() => setLocalSettings({ 
                ...localSettings, 
                includeHashtags: !localSettings.includeHashtags 
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.includeHashtags ? 'bg-anime-purple' : 'bg-dark-lighter'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                localSettings.includeHashtags ? 'translate-x-7' : 'translate-x-1'
              }`}></span>
            </button>
          </div>
          
          <div>
            <label className="block text-sm text-white mb-2">Custom Hashtags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                placeholder="Add hashtag"
                className="input-field flex-1"
              />
              <button
                onClick={addHashtag}
                className="btn-primary px-4"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {localSettings.customHashtags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-anime-purple/20 text-anime-purple rounded-full text-sm"
                >
                  #{tag}
                  <button
                    onClick={() => removeHashtag(tag)}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Categories */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Content Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map(category => (
            <div
              key={category.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                category.enabled
                  ? 'border-anime-purple bg-anime-purple/10'
                  : 'border-dark-lighter bg-dark-lighter/50'
              }`}
              onClick={() => onToggleCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{category.icon}</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  category.enabled
                    ? 'border-anime-purple bg-anime-purple'
                    : 'border-gray-600'
                }`}>
                  {category.enabled && <Check size={12} className="text-white" />}
                </div>
              </div>
              <h4 className="text-white font-medium mt-2">{category.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Save size={18} />
        Save Settings
      </button>
    </div>
  );
}
