'use client';

import React, { useEffect, useState } from 'react';
import TrackCard from './TrackCard';
import RemixUploadModal from './RemixUploadModal';

export default function TracksPage() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadFor, setShowUploadFor] = useState(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  async function fetchTracks() {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
      const res = await fetch(`${backendUrl}/api/tracks`);
      
      if (!res.ok) throw new Error('Failed to load tracks');
      const data = await res.json();
      
      const all = data.tracks || [];
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTracks(all);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Unable to load tracks');
    } finally {
      setLoading(false);
    }
  }

  const handleUploadSuccess = (newTrack) => {
    // refresh list
    fetchTracks();
    setShowUploadFor(null);
  };

  // top-level tracks (no parentId)
  const parents = tracks.filter((t) => !t.parentId);
  
  console.log('Rendering TracksPage:', {
    totalTracks: tracks.length,
    parentTracks: parents.length,
    tracks: tracks,
    parents: parents
  });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Tracks ({parents.length}) - Total: {tracks.length}
        </h2>
        <button
          onClick={fetchTracks}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-bold"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-800/40 text-red-200 p-4 rounded mb-4">
          Error loading tracks: {error}
          <button
            onClick={fetchTracks}
            className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && tracks.length > 0 && parents.length === 0 && (
        <div className="bg-yellow-800/40 text-yellow-200 p-4 rounded mb-4">
          <p className="font-bold">⚠️ {tracks.length} tracks loaded but all are remixes (no parent tracks)</p>
          <p className="text-sm mt-2">All tracks have parentId set</p>
        </div>
      )}

      {!loading && !error && tracks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl mb-2">No tracks yet</p>
          <p>Upload a track to get started!</p>
        </div>
      )}

      {!loading && !error && parents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parents.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              remixes={tracks.filter((r) => r.parentId === track.id)}
              onOpenRemix={() => setShowUploadFor(track.id)}
              onVote={() => fetchTracks()}
            />
          ))}
        </div>
      )}

      {/* Debug view - show raw data */}
      {!loading && !error && tracks.length > 0 && (
        <div className="mt-8 p-4 bg-gray-800/50 rounded">
          <details>
            <summary className="cursor-pointer font-bold mb-2">🔍 Debug: Raw Track Data</summary>
            <div className="max-h-96 overflow-auto text-xs">
              <pre className="text-gray-300">{JSON.stringify(tracks, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}

      {showUploadFor && (
        <RemixUploadModal
          parentId={showUploadFor}
          onClose={() => setShowUploadFor(null)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
