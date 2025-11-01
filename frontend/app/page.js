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
  const [contractsConfigured, setContractsConfigured] = useState(false);

  useEffect(() => {
    // Check if contracts are configured (not needed in backend-only mode)
    const backendOnly = process.env.NEXT_PUBLIC_BACKEND_ONLY === 'true';
    const musicNFT = process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS;
    const voting = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS;
    setContractsConfigured(backendOnly || !!(musicNFT && voting && musicNFT.trim() && voting.trim()));
    
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
        {!contractsConfigured && process.env.NEXT_PUBLIC_BACKEND_ONLY !== 'true' && (
          <div className="mb-6 bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-200">
              ⚠️ <strong>Contracts not configured:</strong> Please deploy contracts and add addresses to <code className="bg-black/30 px-2 py-1 rounded">frontend/.env.local</code>
            </p>
            <p className="text-sm text-yellow-300 mt-2">
              Run: <code className="bg-black/30 px-2 py-1 rounded">npx hardhat run scripts/deploy.js --network monad</code>
            </p>
          </div>
        )}
        
        {process.env.NEXT_PUBLIC_BACKEND_ONLY === 'true' && (
          <div className="mb-6 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-200">
              ℹ️ <strong>Backend-only mode:</strong> Tracks are stored locally. No blockchain/NFT features.
            </p>
          </div>
        )}
        
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

