'use client';

import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { getVotingContract, getVotingContractReadOnly } from '../utils/contracts';
import { fetchFromIPFS, getIPFSURL } from '../utils/ipfs';
import VoteButton from './VoteButton';
import CountdownTimer from './CountdownTimer';

export default function CompetitionView({ trackId, voteCache, onBack }) {
  const { signer, account, isConnected } = useWallet();
  const [competition, setCompetition] = useState(null);
  const [remixes, setRemixes] = useState([]);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitionData();
    setupEventListeners();
  }, [trackId]);

  async function loadCompetitionData() {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'
      );
      const votingContract = getVotingContractReadOnly(provider);

      // Get competition info using memoized tallyVotes
      const comp = await votingContract.getCompetition(trackId);
      const [remixIds, voteCounts] = await votingContract.tallyVotes(trackId);

      setCompetition({
        remixIds: remixIds.map((id) => id.toString()),
        endTime: comp.endTime.toString(),
        prizeAmount: comp.prizeAmount.toString(),
        winnerDeclared: comp.winnerDeclared,
        winnerRemixId: comp.winnerRemixId.toString(),
      });

      // Load remix metadata from IPFS
      const remixesData = await Promise.all(
        remixIds.map(async (id, index) => {
          // Fetch remix metadata from NFT contract
          const metadataHash = 'ipfs-hash-here'; // Get from NFT contract
          const metadata = await fetchFromIPFS(metadataHash);
          return {
            tokenId: id.toString(),
            metadata,
            voteCount: voteCounts[index].toString(),
          };
        })
      );

      setRemixes(remixesData);

      // Update votes from cache (memoized)
      const voteMap = {};
      remixIds.forEach((id, index) => {
        voteMap[id.toString()] = voteCache[trackId]?.[id.toString()] || voteCounts[index].toString();
      });
      setVotes(voteMap);
    } catch (error) {
      console.error('Error loading competition:', error);
    } finally {
      setLoading(false);
    }
  }

  function setupEventListeners() {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'
    );
    const votingContract = getVotingContractReadOnly(provider);

    // Listen for votes and update cache
    votingContract.on('VoteCast', (originalTrackId, remixId, voter, newVoteCount) => {
      if (originalTrackId.toString() === trackId) {
        setVotes((prev) => ({
          ...prev,
          [remixId.toString()]: newVoteCount.toString(),
        }));
      }
    });
  }

  // Memoized sorted remixes by votes (dynamic programming: avoid re-sorting)
  const sortedRemixes = useMemo(() => {
    return [...remixes].sort((a, b) => {
      const votesA = parseInt(votes[a.tokenId] || a.voteCount || 0);
      const votesB = parseInt(votes[b.tokenId] || b.voteCount || 0);
      return votesB - votesA;
    });
  }, [remixes, votes]);

  if (loading) {
    return <div className="text-center py-12">Loading competition...</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-primary hover:underline">
        ← Back to tracks
      </button>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Competition Details</h2>
        {competition && (
          <div className="space-y-4">
            <CountdownTimer endTime={competition.endTime} />
            <div className="flex justify-between">
              <span>Prize: {ethers.formatEther(competition.prizeAmount)} MON</span>
              {competition.winnerDeclared && (
                <span className="text-green-400">Winner Declared!</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Remixes ({remixes.length})</h3>
        {sortedRemixes.map((remix) => (
          <div key={remix.tokenId} className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-lg font-bold">{remix.metadata?.title || 'Untitled'}</h4>
                <p className="text-gray-400 text-sm">{remix.metadata?.description}</p>
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-2xl font-bold text-primary">
                    {votes[remix.tokenId] || remix.voteCount || 0} votes
                  </span>
                  {competition?.winnerRemixId === remix.tokenId && (
                    <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-sm font-bold">
                      🏆 Winner
                    </span>
                  )}
                </div>
              </div>
              <VoteButton
                trackId={trackId}
                remixId={remix.tokenId}
                disabled={!isConnected || competition?.winnerDeclared}
              />
            </div>
            {remix.metadata?.audioHash && (
              <audio
                controls
                className="w-full mt-4"
                src={getIPFSURL(remix.metadata.audioHash)}
              >
                Your browser does not support audio playback.
              </audio>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

