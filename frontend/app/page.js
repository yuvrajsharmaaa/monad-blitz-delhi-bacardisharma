'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Header from '../components/Header';
import TrackList from '../components/TrackList';
import UploadTrack from '../components/UploadTrack';

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracks');

  useEffect(() => {
    loadTracks();
  }, []);

  async function loadTracks() {
    try {
      // In production, fetch tracks from contract events or subgraph
      setLoading(false);
    } catch (error) {
      console.error('Error loading tracks:', error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-4 py-2 ${
                activeTab === 'tracks'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-400'
              }`}
            >
              Tracks
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 ${
                activeTab === 'upload'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-400'
              }`}
            >
              Upload Track
            </button>
          </div>
        </div>

        {activeTab === 'tracks' && <TrackList tracks={tracks} loading={loading} />}
        {activeTab === 'upload' && <UploadTrack onUpload={loadTracks} />}
      </main>
    </div>
  );
}

