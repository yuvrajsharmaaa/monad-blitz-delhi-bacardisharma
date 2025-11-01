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
      const res = await fetch('http://localhost:3002/api/tracks');
      if (!res.ok) throw new Error(`Failed to load tracks: ${res.status}`);
      const data = await res.json();
      // group parents and remixes
      const all = data.tracks || [];
      // sort by createdAt desc
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTracks(all);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unknown error');
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

  return (
    <div>
      {loading && <div className="text-center py-8">Loading tracks...</div>}
      {error && (
        <div className="bg-red-800/40 text-red-200 p-4 rounded mb-4">
          Error loading tracks: {error}
        </div>
      )}

      {!loading && !error && parents.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl mb-2">No tracks yet</p>
          <p>Upload a track to get started!</p>
        </div>
      )}

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
