'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

/**
 * SingleTrackVoting Component
 * Complete voting interface for a single track with prize distribution
 * All actions happen on this one page: submit remixes, vote, end voting, see winner
 */
export default function SingleTrackVoting() {
  const { signer, provider, account } = useWallet();
  
  // Contract state
  const [contract, setContract] = useState(null);
  const [contractRead, setContractRead] = useState(null);
  
  // Track data
  const [trackURI, setTrackURI] = useState('');
  const [host, setHost] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('0');
  const [isHost, setIsHost] = useState(false);
  
  // Voting state
  const [votingActive, setVotingActive] = useState(false);
  const [prizeDistributed, setPrizeDistributed] = useState(false);
  const [winner, setWinner] = useState('');
  const [winningRemixId, setWinningRemixId] = useState(0);
  
  // Remixes
  const [remixes, setRemixes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [remixURI, setRemixURI] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  
  // Contract configuration from environment
  const TRACK_VOTING_ADDRESS = process.env.NEXT_PUBLIC_TRACK_VOTING_ADDRESS;
  const PRIZE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS;

  // TrackVoting ABI
  const TRACK_VOTING_ABI = [
    "function host() view returns (address)",
    "function trackURI() view returns (string)",
    "function prizeAmount() view returns (uint256)",
    "function votingActive() view returns (bool)",
    "function prizeDistributed() view returns (bool)",
    "function winner() view returns (address)",
    "function winningRemixId() view returns (uint256)",
    "function remixCount() view returns (uint256)",
    "function submitRemix(string calldata _remixURI)",
    "function vote(uint256 _remixId)",
    "function endVoting()",
    "function getAllRemixes() view returns (uint256[], address[], string[], uint256[])",
    "function hasUserVoted(address _voter) view returns (bool)",
    "function getVotingStatus() view returns (bool, bool, address, uint256, uint256)",
    "event RemixSubmitted(uint256 indexed remixId, address indexed remixer, string remixURI)",
    "event VoteCast(address indexed voter, uint256 indexed remixId, uint256 newVoteCount)",
    "event VotingEnded(uint256 indexed winningRemixId, address indexed winner, uint256 voteCount)",
    "event PrizeDistributed(address indexed winner, uint256 amount)"
  ];

  // Prize Token ABI (for approval)
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
  ];

  // Initialize contract
  useEffect(() => {
    if (!TRACK_VOTING_ADDRESS) {
      setStatus('⚠️ Contract address not configured');
      return;
    }

    if (provider) {
      const readContract = new ethers.Contract(TRACK_VOTING_ADDRESS, TRACK_VOTING_ABI, provider);
      setContractRead(readContract);
      loadTrackData(readContract);
      setupEventListeners(readContract);
    }

    if (signer) {
      const writeContract = new ethers.Contract(TRACK_VOTING_ADDRESS, TRACK_VOTING_ABI, signer);
      setContract(writeContract);
    }
  }, [provider, signer, account]);

  // Load track data
  async function loadTrackData(contractInstance) {
    try {
      const [uri, hostAddr, prize, active, distributed, winnerAddr, winningId] = await Promise.all([
        contractInstance.trackURI(),
        contractInstance.host(),
        contractInstance.prizeAmount(),
        contractInstance.votingActive(),
        contractInstance.prizeDistributed(),
        contractInstance.winner(),
        contractInstance.winningRemixId()
      ]);

      setTrackURI(uri);
      setHost(hostAddr);
      setPrizeAmount(ethers.formatEther(prize));
      setVotingActive(active);
      setPrizeDistributed(distributed);
      setWinner(winnerAddr);
      setWinningRemixId(Number(winningId));

      if (account) {
        setIsHost(account.toLowerCase() === hostAddr.toLowerCase());
        const voted = await contractInstance.hasUserVoted(account);
        setHasVoted(voted);
      }

      await loadRemixes(contractInstance);
    } catch (error) {
      console.error('Load data error:', error);
      setStatus(`Error loading data: ${error.message}`);
    }
  }

  // Load all remixes
  async function loadRemixes(contractInstance) {
    try {
      const [ids, remixers, uris, votes] = await contractInstance.getAllRemixes();
      
      const remixList = ids.map((id, index) => ({
        id: Number(id),
        remixer: remixers[index],
        uri: uris[index],
        votes: Number(votes[index])
      }));

      // Sort by votes (highest first)
      remixList.sort((a, b) => b.votes - a.votes);
      setRemixes(remixList);
    } catch (error) {
      console.error('Load remixes error:', error);
    }
  }

  // Setup event listeners with polling (Monad RPC doesn't support eth_newFilter)
  function setupEventListeners(contractInstance) {
    let lastBlockChecked = null;
    let pollingInterval = null;

    const pollForEvents = async () => {
      try {
        if (!contractInstance || !contractInstance.runner) return;
        
        const provider = contractInstance.runner.provider;
        const currentBlock = await provider.getBlockNumber();
        
        if (lastBlockChecked === null) {
          lastBlockChecked = currentBlock;
          return;
        }
        
        if (currentBlock <= lastBlockChecked) return;
        
        const fromBlock = lastBlockChecked + 1;
        const toBlock = currentBlock;
        
        // Query RemixSubmitted events
        try {
          const remixFilter = contractInstance.filters.RemixSubmitted();
          const remixEvents = await contractInstance.queryFilter(remixFilter, fromBlock, toBlock);
          for (const event of remixEvents) {
            console.log('Remix submitted:', event.args);
            loadRemixes(contractInstance);
            setStatus('✅ New remix submitted!');
          }
        } catch (err) {
          console.error('RemixSubmitted query error:', err);
        }
        
        // Query VoteCast events
        try {
          const voteFilter = contractInstance.filters.VoteCast();
          const voteEvents = await contractInstance.queryFilter(voteFilter, fromBlock, toBlock);
          for (const event of voteEvents) {
            const [voter, remixId, newVoteCount] = event.args;
            console.log('Vote cast:', voter, remixId, newVoteCount);
            loadRemixes(contractInstance);
            if (account && voter.toLowerCase() === account.toLowerCase()) {
              setHasVoted(true);
              setStatus('✅ Your vote has been recorded!');
            }
          }
        } catch (err) {
          console.error('VoteCast query error:', err);
        }
        
        // Query VotingEnded events
        try {
          const endFilter = contractInstance.filters.VotingEnded();
          const endEvents = await contractInstance.queryFilter(endFilter, fromBlock, toBlock);
          for (const event of endEvents) {
            const [winningId, winnerAddr, voteCount] = event.args;
            console.log('Voting ended:', winningId, winnerAddr, voteCount);
            setVotingActive(false);
            setWinner(winnerAddr);
            setWinningRemixId(Number(winningId));
            setStatus('🏆 Voting ended! Winner declared!');
          }
        } catch (err) {
          console.error('VotingEnded query error:', err);
        }
        
        // Query PrizeDistributed events
        try {
          const prizeFilter = contractInstance.filters.PrizeDistributed();
          const prizeEvents = await contractInstance.queryFilter(prizeFilter, fromBlock, toBlock);
          for (const event of prizeEvents) {
            const [winnerAddr, amount] = event.args;
            console.log('Prize distributed:', winnerAddr, amount);
            setPrizeDistributed(true);
            setStatus(`💰 Prize of ${ethers.formatEther(amount)} MON sent to winner!`);
          }
        } catch (err) {
          console.error('PrizeDistributed query error:', err);
        }
        
        lastBlockChecked = currentBlock;
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollingInterval = setInterval(pollForEvents, 3000);
    pollForEvents();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }

  // Submit remix
  async function handleSubmitRemix() {
    if (!contract || !remixURI) return;
    
    setLoading(true);
    try {
      setStatus('📤 Submitting remix...');
      const tx = await contract.submitRemix(remixURI);
      setStatus('⏳ Transaction pending...');
      await tx.wait();
      setStatus('✅ Remix submitted successfully!');
      setRemixURI('');
      setShowSubmitForm(false);
      await loadRemixes(contractRead);
    } catch (error) {
      console.error('Submit error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Vote for remix
  async function handleVote(remixId) {
    if (!contract) return;
    
    setLoading(true);
    try {
      setStatus('🗳️ Casting vote...');
      const tx = await contract.vote(remixId);
      setStatus('⏳ Transaction pending...');
      await tx.wait();
      setStatus('✅ Vote cast successfully!');
      setHasVoted(true);
      await loadRemixes(contractRead);
    } catch (error) {
      console.error('Vote error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // End voting (host only)
  async function handleEndVoting() {
    if (!contract) return;
    
    // Check if host has approved the contract
    if (PRIZE_TOKEN_ADDRESS) {
      try {
        const tokenContract = new ethers.Contract(PRIZE_TOKEN_ADDRESS, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account, TRACK_VOTING_ADDRESS);
        const required = ethers.parseEther(prizeAmount);
        
        if (allowance < required) {
          setStatus('⚠️ Approving prize tokens...');
          const approveTx = await tokenContract.approve(TRACK_VOTING_ADDRESS, required);
          setStatus('⏳ Approval pending...');
          await approveTx.wait();
          setStatus('✅ Tokens approved!');
        }
      } catch (error) {
        console.error('Approval error:', error);
        setStatus(`❌ Approval failed: ${error.message}`);
        return;
      }
    }
    
    setLoading(true);
    try {
      setStatus('🏁 Ending voting and distributing prize...');
      const tx = await contract.endVoting();
      setStatus('⏳ Transaction pending...');
      const receipt = await tx.wait();
      setStatus('✅ Voting ended! Prize distributed to winner!');
      await loadTrackData(contractRead);
    } catch (error) {
      console.error('End voting error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">🎵 Track Voting & Prize Distribution</h1>
        <p className="text-gray-300">Submit remixes, vote, and win prizes on Monad testnet</p>
      </div>

      {/* Contract Not Configured Warning */}
      {!TRACK_VOTING_ADDRESS && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-200">
            ⚠️ <strong>TrackVoting contract not configured!</strong>
            <br />Please deploy the contract and add NEXT_PUBLIC_TRACK_VOTING_ADDRESS to .env.local
          </p>
        </div>
      )}

      {/* Track Info */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Track Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Host</label>
            <p className="font-mono text-sm">
              {host ? `${host.slice(0, 6)}...${host.slice(-4)}` : 'Loading...'}
              {isHost && <span className="ml-2 text-purple-400">(You)</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Prize</label>
            <p className="text-2xl font-bold text-yellow-400">{prizeAmount} MON</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400">Track URI</label>
            <p className="font-mono text-xs break-all text-gray-300">{trackURI || 'Loading...'}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex gap-2">
          {votingActive ? (
            <span className="px-3 py-1 bg-green-600 rounded-full text-sm font-bold">
              🟢 VOTING ACTIVE
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">
              🔴 VOTING ENDED
            </span>
          )}
          {prizeDistributed && (
            <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">
              💰 PRIZE DISTRIBUTED
            </span>
          )}
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg ${
          status.includes('❌') ? 'bg-red-900/40 text-red-200' :
          status.includes('✅') ? 'bg-green-900/40 text-green-200' :
          status.includes('⚠️') ? 'bg-yellow-900/40 text-yellow-200' :
          'bg-blue-900/40 text-blue-200'
        }`}>
          {status}
        </div>
      )}

      {/* Winner Display */}
      {!votingActive && winner && winner !== ethers.ZeroAddress && (
        <div className="bg-gradient-to-r from-yellow-900 to-orange-900 border-2 border-yellow-500 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏆</span>
            <h2 className="text-2xl font-bold">Winner!</h2>
          </div>
          <p className="text-lg mb-2">
            Remix #{winningRemixId} by{' '}
            <span className="font-mono font-bold">
              {winner.slice(0, 6)}...{winner.slice(-4)}
            </span>
          </p>
          {prizeDistributed && (
            <p className="text-green-300">
              ✅ Prize of {prizeAmount} MON tokens distributed!
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {votingActive && !isHost && !hasVoted && (
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition"
          >
            📤 Submit Remix
          </button>
        )}
        
        {votingActive && isHost && remixes.length > 0 && (
          <button
            onClick={handleEndVoting}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition disabled:opacity-50"
          >
            🏁 End Voting & Distribute Prize
          </button>
        )}
      </div>

      {/* Submit Remix Form */}
      {showSubmitForm && votingActive && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Submit Your Remix</h3>
          <input
            type="text"
            value={remixURI}
            onChange={(e) => setRemixURI(e.target.value)}
            placeholder="Enter remix URI (ipfs:// or http://...)"
            className="w-full px-4 py-3 bg-gray-900 rounded-lg mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitRemix}
              disabled={loading || !remixURI}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={() => setShowSubmitForm(false)}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Remixes List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">
          Remixes ({remixes.length})
        </h2>

        {remixes.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No remixes submitted yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {remixes.map((remix, index) => (
              <div
                key={remix.id}
                className={`p-4 rounded-lg border-2 ${
                  remix.id === winningRemixId && !votingActive
                    ? 'border-yellow-500 bg-yellow-900/20'
                    : 'border-gray-700 bg-gray-900'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Ranking medals */}
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      
                      <span className="text-sm text-gray-400">
                        Remix #{remix.id}
                      </span>
                      
                      {remix.id === winningRemixId && !votingActive && (
                        <span className="px-2 py-1 bg-yellow-600 rounded-full text-xs font-bold">
                          🏆 WINNER
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 font-mono mb-2">
                      by {remix.remixer.slice(0, 6)}...{remix.remixer.slice(-4)}
                    </p>
                    
                    <p className="text-xs text-gray-400 break-all">
                      {remix.uri}
                    </p>
                  </div>

                  {/* Vote Count */}
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-purple-400">
                      {remix.votes}
                    </div>
                    <div className="text-xs text-gray-400">votes</div>
                  </div>
                </div>

                {/* Vote Button */}
                {votingActive && !hasVoted && !isHost && (
                  <button
                    onClick={() => handleVote(remix.id)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition disabled:opacity-50"
                  >
                    🗳️ Vote for this Remix
                  </button>
                )}
                
                {hasVoted && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ✅ You have already voted
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
        <h3 className="font-bold mb-2">ℹ️ How It Works</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Submit your remix URI to enter the competition</li>
          <li>• Vote for your favorite remix (one vote per wallet)</li>
          <li>• Host ends voting when ready</li>
          <li>• Remix with most votes wins the prize automatically</li>
          <li>• Prize MON tokens sent directly to winner</li>
        </ul>
      </div>
    </div>
  );
}
