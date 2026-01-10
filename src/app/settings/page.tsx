'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { SettingsPanel } from '@/components/SettingsNew';
import { useAppStore } from '@/lib/store';
import { BotSettings } from '@/types';

export default function SettingsPage() {
  const { 
    settings, 
    updateSettings, 
    categories, 
    toggleCategory 
  } = useAppStore();

  const handleSaveSettings = (newSettings: BotSettings) => {
    updateSettings(newSettings);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">
            Configure your bot settings for Weebnesia Facebook Page
          </p>
        </div>

        <SettingsPanel
          settings={settings}
          categories={categories}
          onSaveSettings={handleSaveSettings}
          onToggleCategory={toggleCategory}
        />
      </div>
    </Layout>
  );
}
