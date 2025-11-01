'use client';

import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { getMusicNFTContractReadOnly, getVotingContractReadOnly } from '../utils/contracts';
import { fetchFromIPFS, getIPFSURL } from '../utils/ipfs';
import CompetitionView from './CompetitionView';

export default function TrackList({ tracks, loading }) {
  const [allTracks, setAllTracks] = useState([]);
  const [competitions, setCompetitions] = useState({});
  const [voteCache, setVoteCache] = useState({}); // Memoization for votes
  const [selectedTrack, setSelectedTrack] = useState(null);

  useEffect(() => {
    loadTracksAndCompetitions();
    
    // Set up event listeners for real-time updates
    setupEventListeners();
  }, []);

  async function loadTracksAndCompetitions() {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'
      );
      
      // In production, fetch from contract events or subgraph
      // For now, use mock data or fetch from blockchain
      setAllTracks([]);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  }

  function setupEventListeners() {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'
    );
    const votingContract = getVotingContractReadOnly(provider);

    // Listen for vote events (memoized updates)
    votingContract.on('VoteCast', (originalTrackId, remixId, voter, newVoteCount) => {
      updateVoteCache(originalTrackId.toString(), remixId.toString(), newVoteCount.toString());
    });

    // Listen for winner declarations
    votingContract.on('WinnerDeclared', (originalTrackId, winnerRemixId, winnerCreator, totalVotes) => {
      updateCompetition(originalTrackId.toString(), {
        winnerDeclared: true,
        winnerRemixId: winnerRemixId.toString(),
        totalVotes: totalVotes.toString(),
      });
    });
  }

  function updateVoteCache(originalTrackId, remixId, voteCount) {
    setVoteCache((prev) => ({
      ...prev,
      [originalTrackId]: {
        ...prev[originalTrackId],
        [remixId]: voteCount,
      },
    }));
  }

  function updateCompetition(originalTrackId, updates) {
    setCompetitions((prev) => ({
      ...prev,
      [originalTrackId]: {
        ...prev[originalTrackId],
        ...updates,
      },
    }));
  }

  // Memoized vote counts using cache (dynamic programming pattern)
  const getVoteCount = useMemo(() => {
    return (originalTrackId, remixId) => {
      return voteCache[originalTrackId]?.[remixId] || 0;
    };
  }, [voteCache]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Loading tracks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedTrack ? (
        <CompetitionView
          trackId={selectedTrack}
          voteCache={voteCache}
          onBack={() => setSelectedTrack(null)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTracks.map((track) => (
            <TrackCard
              key={track.tokenId}
              track={track}
              onClick={() => setSelectedTrack(track.tokenId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrackCard({ track, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition"
    >
      <h3 className="text-xl font-bold mb-2">{track.title || 'Untitled'}</h3>
      <p className="text-gray-400 text-sm mb-4">{track.description || 'No description'}</p>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Token ID: {track.tokenId}</span>
        {track.isRemix && <span className="text-secondary">Remix</span>}
      </div>
    </div>
  );
}

