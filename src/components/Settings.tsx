'use client';

import React, { useState } from 'react';
import { Save, Eye, EyeOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { BotSettings, PostCategory } from '@/types';
import { CaptionStyle } from '@/lib/groq';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
  settings: BotSettings;
  categories: PostCategory[];
  onSaveSettings: (settings: BotSettings) => void;
  onToggleCategory: (categoryId: string) => void;
  onVerifyToken: () => Promise<boolean>;
}

export function SettingsPanel({
  settings,
  categories,
  onSaveSettings,
  onToggleCategory,
  onVerifyToken
}: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<BotSettings>(settings);
  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [newHashtag, setNewHashtag] = useState('');

  const handleSave = () => {
    onSaveSettings(localSettings);
    toast.success('Settings saved!');
  };

  const handleVerify = async () => {
    if (!localSettings.fbPageId || !localSettings.fbAccessToken) {
      toast.error('Please enter Page ID and Access Token first');
      return;
    }
    
    setIsVerifying(true);
    try {
      const valid = await onVerifyToken();
      setTokenValid(valid);
      if (valid) {
        toast.success('Token verified successfully!');
      } else {
        toast.error('Invalid token or Page ID');
      }
    } catch (error) {
      toast.error('Verification failed');
      setTokenValid(false);
    }
    setIsVerifying(false);
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
      {/* Facebook Settings */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Facebook Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Page ID</label>
            <input
              type="text"
              value={localSettings.fbPageId}
              onChange={(e) => setLocalSettings({ ...localSettings, fbPageId: e.target.value })}
              placeholder="Your Facebook Page ID"
              className="input-field w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Page Access Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={localSettings.fbAccessToken}
                onChange={(e) => {
                  setLocalSettings({ ...localSettings, fbAccessToken: e.target.value });
                  setTokenValid(null);
                }}
                placeholder="Your Page Access Token"
                className="input-field w-full pr-24"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded bg-anime-purple/20 text-anime-purple hover:bg-anime-purple/30"
              >
                {isVerifying ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : tokenValid === true ? (
                  <Check size={16} className="text-green-400" />
                ) : tokenValid === false ? (
                  <AlertCircle size={16} className="text-red-400" />
                ) : (
                  <Check size={16} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your token from Facebook Developer Portal
            </p>
          </div>
        </div>
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
              className={`
                w-12 h-6 rounded-full transition-all relative
                ${localSettings.autoPostEnabled ? 'bg-anime-pink' : 'bg-gray-600'}
              `}
            >
              <span className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                ${localSettings.autoPostEnabled ? 'left-7' : 'left-1'}
              `} />
            </button>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Post Interval (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={1440}
              value={localSettings.postInterval}
              onChange={(e) => setLocalSettings({ 
                ...localSettings, 
                postInterval: parseInt(e.target.value) || 60 
              })}
              className="input-field w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 5 minutes, Maximum 1440 minutes (24 hours)
            </p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Max Posts Per Day
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={localSettings.maxPostsPerDay}
              onChange={(e) => setLocalSettings({ 
                ...localSettings, 
                maxPostsPerDay: parseInt(e.target.value) || 10 
              })}
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
            <label className="block text-sm text-gray-400 mb-2">Caption Style</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['formal', 'casual', 'otaku', 'meme'] as CaptionStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setLocalSettings({ ...localSettings, captionStyle: style })}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${localSettings.captionStyle === style 
                      ? 'bg-anime-pink text-white' 
                      : 'bg-anime-darker text-gray-400 hover:bg-anime-dark border border-gray-700'
                    }
                  `}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
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
              className={`
                w-12 h-6 rounded-full transition-all relative
                ${localSettings.includeHashtags ? 'bg-anime-pink' : 'bg-gray-600'}
              `}
            >
              <span className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                ${localSettings.includeHashtags ? 'left-7' : 'left-1'}
              `} />
            </button>
          </div>
          
          {localSettings.includeHashtags && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Custom Hashtags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                  placeholder="Add hashtag"
                  className="input-field flex-1"
                />
                <button onClick={addHashtag} className="btn-secondary">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {localSettings.customHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-anime-purple/20 text-anime-purple rounded-full text-sm flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Content Categories</h3>
        
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`
                flex items-center justify-between p-4 rounded-lg border transition-all
                ${category.enabled 
                  ? 'border-anime-pink/50 bg-anime-pink/10' 
                  : 'border-gray-700 bg-anime-darker'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <p className="text-white font-medium">{category.name}</p>
                  <p className="text-xs text-gray-400">{category.description}</p>
                </div>
              </div>
              <button
                onClick={() => onToggleCategory(category.id)}
                className={`
                  w-12 h-6 rounded-full transition-all relative
                  ${category.enabled ? 'bg-anime-pink' : 'bg-gray-600'}
                `}
              >
                <span className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                  ${category.enabled ? 'left-7' : 'left-1'}
                `} />
              </button>
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
