'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';

// Lazy load heavy components for better performance
const TracksPage = dynamic(() => import('../components/TracksPage'), {
  loading: () => <div className="text-center py-8">Loading...</div>
});
const UploadTrack = dynamic(() => import('../components/UploadTrack'), {
  loading: () => <div className="text-center py-8">Loading...</div>
});
const MultiRemixBattle = dynamic(() => import('../components/MultiRemixBattle'), {
  loading: () => <div className="text-center py-8">Loading...</div>
});
const SingleTrackVoting = dynamic(() => import('../components/SingleTrackVoting'), {
  loading: () => <div className="text-center py-8">Loading...</div>
});

export default function Home() {
  const [activeTab, setActiveTab] = useState('tracks');

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <nav className="mb-6 overflow-x-auto">
          <div className="flex gap-2 sm:gap-4 border-b border-gray-700 min-w-max">
            {[
              { id: 'tracks', label: 'Tracks' },
              { id: 'upload', label: 'Upload' },
              { id: 'battles', label: '🏆 Battles' },
              { id: 'voting', label: '🗳️ Voting' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === 'tracks' && <TracksPage />}
        {activeTab === 'upload' && <UploadTrack />}
        {activeTab === 'battles' && <MultiRemixBattle />}
        {activeTab === 'voting' && <SingleTrackVoting />}
      </main>
    </div>
  );
}

