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
    const backendOnly = process.env.NEXT_PUBLIC_BACKEND_ONLY === 'true';
    
    if (!backendOnly) {
      loadTracksAndCompetitions();
      // Set up event listeners for real-time updates
      setupEventListeners();
    }

    // Cleanup event listeners on unmount
    return () => {
      if (window.__tracklist_cleanup) {
        window.__tracklist_cleanup();
        delete window.__tracklist_cleanup;
      }
    };
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
    if (!votingContract) {
      // No voting contract configured — skip event wiring
      return;
    }

    // Polling for events (Monad RPC doesn't support eth_newFilter)
    let lastBlockChecked = null;
    let pollingInterval = null;

    const pollForEvents = async () => {
      try {
        if (!votingContract || !votingContract.runner) return;
        
        const provider = votingContract.runner.provider;
        const currentBlock = await provider.getBlockNumber();
        
        if (lastBlockChecked === null) {
          lastBlockChecked = currentBlock;
          return;
        }
        
        if (currentBlock <= lastBlockChecked) return;
        
        // Limit block range to 100 (Monad RPC limitation)
        const fromBlock = lastBlockChecked + 1;
        const toBlock = Math.min(currentBlock, fromBlock + 99);
        
        // Query VoteCast events
        try {
          const voteFilter = votingContract.filters.VoteCast();
          const voteEvents = await votingContract.queryFilter(voteFilter, fromBlock, toBlock);
          for (const event of voteEvents) {
            const [originalTrackId, remixId, voter, newVoteCount] = event.args;
            updateVoteCache(originalTrackId.toString(), remixId.toString(), newVoteCount.toString());
          }
        } catch (err) {
          console.error('VoteCast query error:', err);
        }
        
        // Query WinnerDeclared events
        try {
          const winnerFilter = votingContract.filters.WinnerDeclared();
          const winnerEvents = await votingContract.queryFilter(winnerFilter, fromBlock, toBlock);
          for (const event of winnerEvents) {
            const [originalTrackId, winnerRemixId, winnerCreator, totalVotes] = event.args;
            updateCompetition(originalTrackId.toString(), {
              winnerDeclared: true,
              winnerRemixId: winnerRemixId.toString(),
              totalVotes: totalVotes.toString(),
            });
          }
        } catch (err) {
          console.error('WinnerDeclared query error:', err);
        }
        
        // Update last checked block (use toBlock to handle chunking)
        lastBlockChecked = toBlock;
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollingInterval = setInterval(pollForEvents, 3000);
    pollForEvents();

    // Cleanup function: clear interval when component unmounts
    window.__tracklist_cleanup = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
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

