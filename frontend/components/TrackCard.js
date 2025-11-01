'use client';

import React, { useState } from 'react';
import VoteButton from './VoteButton';

export default function TrackCard({ track, remixes = [], onOpenRemix, onVote }) {
  const [expanded, setExpanded] = useState(false);

  const handleVote = async () => {
    try {
      // call backend to increment vote count (optimistic update)
      const res = await fetch(`http://localhost:3002/api/tracks/${track.id}/vote`, {
        method: 'PATCH',
      });
      if (res.ok) {
        if (onVote) onVote();
      }
    } catch (err) {
      console.error('Vote error', err);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{track.title}</h3>
            {remixes.length > 0 && (
              <span className="px-2 py-1 bg-purple-600 rounded-full text-xs">
                {remixes.length} remix{remixes.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{track.description}</p>
          <p className="text-xs text-gray-500 mt-2">Uploaded by: {track.artist}</p>
          <p className="text-xs text-gray-500">Created: {new Date(track.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {remixes.length > 0 && (
            <button
              onClick={() => setExpanded((s) => !s)}
              className="px-3 py-1 bg-primary rounded text-sm"
            >
              {expanded ? 'Hide Remixes' : 'Show Remixes'}
            </button>
          )}
          <button
            onClick={onOpenRemix}
            className="px-3 py-1 bg-secondary rounded text-sm"
          >
            Upload Remix
          </button>
        </div>
      </div>

      <div className="mt-4">
        <audio controls src={track.fileUrl} className="w-full" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-primary font-bold">{track.voteCount || 0} votes</div>
        <div className="flex items-center gap-3">
          <button onClick={handleVote} className="px-3 py-1 bg-green-600 rounded text-sm">Vote</button>
        </div>
      </div>

      {expanded && remixes.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <h4 className="font-bold text-purple-400 mb-3">
            Remixes ({remixes.length})
          </h4>
          {remixes.map((r) => (
            <div key={r.id} className="mt-3 p-3 bg-gray-900 rounded border border-purple-500/30">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-purple-300">🎵 {r.title}</div>
                  <div className="text-xs text-gray-400">by {r.artist}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm text-primary font-bold">{r.voteCount || 0} votes</div>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`http://localhost:3002/api/tracks/${r.id}/vote`, {
                          method: 'PATCH',
                        });
                        if (res.ok && onVote) onVote();
                      } catch (err) {
                        console.error('Vote error', err);
                      }
                    }}
                    className="px-2 py-1 bg-green-600 rounded text-xs"
                  >
                    Vote
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <audio controls src={r.fileUrl} className="w-full" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
