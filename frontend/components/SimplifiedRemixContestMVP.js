'use client';

/**
 * SimplifiedRemixContestMVP
 * 
 * MVP Flow:
 * 1. Host creates contest with track URI and prize amount
 * 2. Host uploads ONE remix and inputs payout wallet address
 * 3. Users vote once on the remix
 * 4. Host ends contest → Prize automatically sent to payout wallet
 * 
 * All on-chain via Monad testnet
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

// Contract ABI - only the functions we need
const CONTEST_ABI = [
  "function contestCount() view returns (uint256)",
  "function contests(uint256) view returns (uint256 id, address host, string trackURI, uint256 prizeAmount, bool active, string remixURI, address payoutWallet, uint256 voteCount, uint256 createdAt, uint256 endedAt)",
  "function createContest(string trackURI, uint256 prizeAmount) returns (uint256)",
  "function uploadRemix(uint256 contestId, string remixURI, address payoutWallet)",
  "function vote(uint256 contestId)",
  "function endContestAndPay(uint256 contestId)",
  "function hasVoted(uint256 contestId, address voter) view returns (bool)",
  "function checkVoted(uint256 contestId, address voter) view returns (bool)",
  "event ContestCreated(uint256 indexed contestId, address indexed host, string trackURI, uint256 prizeAmount)",
  "event RemixUploaded(uint256 indexed contestId, string remixURI, address indexed payoutWallet)",
  "event VoteCast(uint256 indexed contestId, address indexed voter, uint256 newVoteCount)",
  "event ContestEnded(uint256 indexed contestId, address indexed winner, uint256 prizeAmount, bytes32 indexed txHash)",
  "event PrizePaid(uint256 indexed contestId, address indexed recipient, uint256 amount)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
];

export default function SimplifiedRemixContestMVP() {
  const { signer, provider, account, isConnected } = useWallet();
  
  // Contract addresses
  const CONTEST_ADDRESS = process.env.NEXT_PUBLIC_SIMPLIFIED_CONTEST_ADDRESS;
  const PRIZE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS;
  
  // State
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  
  // Create contest form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [trackURI, setTrackURI] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('10');
  
  // Upload remix form
  const [uploadingContestId, setUploadingContestId] = useState(null);
  const [remixURI, setRemixURI] = useState('');
  const [payoutWallet, setPayoutWallet] = useState('');
  
  // Load contests on mount
  useEffect(() => {
    if (provider && CONTEST_ADDRESS) {
      loadContests();
    }
  }, [provider, CONTEST_ADDRESS, account]);
  
  // Event polling (Monad RPC doesn't support eth_newFilter)
  useEffect(() => {
    if (!provider || !CONTEST_ADDRESS) return;
    
    const contract = new ethers.Contract(CONTEST_ADDRESS, CONTEST_ABI, provider);
    let lastBlockChecked = null;
    let pollingInterval = null;

    const pollForEvents = async () => {
      try {
        if (!contract || !contract.runner) return;
        
        const currentBlock = await provider.getBlockNumber();
        
        if (lastBlockChecked === null) {
          lastBlockChecked = currentBlock;
          return;
        }
        
        if (currentBlock <= lastBlockChecked) return;
        
        // Monad RPC limit: max 100 blocks
        const fromBlock = lastBlockChecked + 1;
        const toBlock = Math.min(currentBlock, fromBlock + 99);
        
        // Query all events
        const events = ['ContestCreated', 'RemixUploaded', 'VoteCast', 'ContestEnded', 'PrizePaid'];
        
        for (const eventName of events) {
          try {
            const filter = contract.filters[eventName]();
            const eventLogs = await contract.queryFilter(filter, fromBlock, toBlock);
            if (eventLogs.length > 0) {
              console.log(`${eventName} events:`, eventLogs.length);
              loadContests(); // Refresh on any event
              break;
            }
          } catch (err) {
            console.error(`${eventName} query error:`, err);
          }
        }
        
        lastBlockChecked = toBlock;
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollingInterval = setInterval(pollForEvents, 3000);
    pollForEvents();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [provider, CONTEST_ADDRESS]);
  
  /**
   * Load all contests
   */
  const loadContests = async () => {
    if (!provider || !CONTEST_ADDRESS) return;
    
    try {
      setLoading(true);
      const contract = new ethers.Contract(CONTEST_ADDRESS, CONTEST_ABI, provider);
      const count = await contract.contestCount();
      
      const contestsData = [];
      
      for (let i = 1; i <= Number(count); i++) {
        const contest = await contract.contests(i);
        
        // Check if current user voted
        let userVoted = false;
        if (account) {
          try {
            userVoted = await contract.checkVoted(i, account);
          } catch (err) {
            console.error('Error checking vote:', err);
          }
        }
        
        contestsData.push({
          id: Number(contest[0]),
          host: contest[1],
          trackURI: contest[2],
          prizeAmount: ethers.formatEther(contest[3]),
          active: contest[4],
          remixURI: contest[5],
          payoutWallet: contest[6],
          voteCount: Number(contest[7]),
          createdAt: Number(contest[8]),
          endedAt: Number(contest[9]),
          userVoted
        });
      }
      
      setContests(contestsData.reverse());
    } catch (error) {
      console.error('Load contests error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Create new contest
   */
  const handleCreateContest = async () => {
    if (!signer || !trackURI || !prizeAmount) {
      setStatus('❌ Please fill all fields');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('💰 Step 1/3: Approving tokens...');
      
      // Approve tokens
      const tokenContract = new ethers.Contract(PRIZE_TOKEN_ADDRESS, ERC20_ABI, signer);
      const amount = ethers.parseEther(prizeAmount);
      const approveTx = await tokenContract.approve(CONTEST_ADDRESS, amount);
      setTxHash(approveTx.hash);
      await approveTx.wait();
      
      // Create contest
      setStatus('🎵 Step 2/3: Creating contest...');
      const contract = new ethers.Contract(CONTEST_ADDRESS, CONTEST_ABI, signer);
      const createTx = await contract.createContest(trackURI, amount);
      setTxHash(createTx.hash);
      await createTx.wait();
      
      setStatus(`✅ Step 3/3: Contest created! Prize: ${prizeAmount} MON`);
      setShowCreateForm(false);
      setTrackURI('');
      setPrizeAmount('10');
      
      setTimeout(() => loadContests(), 2000);
      
    } catch (error) {
      console.error('Create contest error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Upload remix with payout wallet
   */
  const handleUploadRemix = async (contestId) => {
    if (!signer || !remixURI || !payoutWallet) {
      setStatus('❌ Please enter remix URI and payout wallet');
      return;
    }
    
    if (!ethers.isAddress(payoutWallet)) {
      setStatus('❌ Invalid wallet address');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('📤 Uploading remix...');
      
      const contract = new ethers.Contract(CONTEST_ADDRESS, CONTEST_ABI, signer);
      const tx = await contract.uploadRemix(contestId, remixURI, payoutWallet);
      setTxHash(tx.hash);
      await tx.wait();
      
      setStatus(`✅ Remix uploaded! Payout wallet: ${payoutWallet.slice(0,6)}...${payoutWallet.slice(-4)}`);
      setUploadingContestId(null);
      setRemixURI('');
      setPayoutWallet('');
      
      setTimeout(() => loadContests(), 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Vote for remix
   */
  const handleVote = async (contestId) => {
    if (!signer) {
      setStatus('❌ Please connect wallet');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('🗳️ Casting vote...');
      
      const contract = new ethers.Contract(CONTEST_ADDRESS, CONTEST_ABI, signer);
      const tx = await contract.vote(contestId);
      setTxHash(tx.hash);
      await tx.wait();
      
      setStatus('✅ Vote recorded on-chain!');
      setTimeout(() => loadContests(), 2000);
      
    } catch (error) {
      console.error('Vote error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * End contest and pay winner
   */
  const handleEndContest = async (contestId) => {
    if (!signer) {
      setStatus('❌ Please connect wallet');
      return;
    }
    
    if (!confirm('End this contest and pay the prize to the payout wallet?')) {
      return;
    }
    
    try {
      setLoading(true);
      setStatus('🏁 Ending contest and paying prize...');
      
      const contract = new ethers.Contract(CONTEST_ADDRESS, CONTEST_ABI, signer);
      const tx = await contract.endContestAndPay(contestId);
      setTxHash(tx.hash);
      
      const receipt = await tx.wait();
      
      // Parse PrizePaid event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'PrizePaid';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        const recipient = parsed.args[1];
        const amount = ethers.formatEther(parsed.args[2]);
        setStatus(`🏆 Contest ended! ${amount} MON sent to ${recipient.slice(0,6)}...${recipient.slice(-4)}`);
      } else {
        setStatus('✅ Contest ended and prize paid!');
      }
      
      setTimeout(() => loadContests(), 2000);
      
    } catch (error) {
      console.error('End contest error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isConnected) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">🎵 Remix Contest MVP</h2>
        <p className="text-gray-400 mb-6">Connect wallet to create and vote on remix contests</p>
        <div className="text-sm text-gray-500 max-w-md mx-auto text-left space-y-2">
          <p>✨ <strong>Simple Flow:</strong></p>
          <p>1. Host creates contest with prize</p>
          <p>2. Host uploads ONE remix with payout wallet</p>
          <p>3. Users vote (once per wallet)</p>
          <p>4. Host ends contest → Prize sent on-chain ✓</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎵 Remix Contest MVP</h1>
        <p className="text-gray-400">One remix per contest with on-chain voting and prizes</p>
        <p className="text-sm text-gray-500 mt-2">Monad Testnet</p>
      </div>
      
      {/* Status */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg border ${
          status.includes('❌') 
            ? 'bg-red-900/30 border-red-500 text-red-200'
            : status.includes('✅') || status.includes('🏆')
            ? 'bg-green-900/30 border-green-500 text-green-200'
            : 'bg-blue-900/30 border-blue-500 text-blue-200'
        }`}>
          <p>{status}</p>
          {txHash && (
            <a 
              href={`https://testnet.monadexplorer.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline mt-2 inline-block"
            >
              View TX: {txHash.slice(0, 10)}...{txHash.slice(-8)} →
            </a>
          )}
        </div>
      )}
      
      {/* Create Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
        >
          {showCreateForm ? '✕ Cancel' : '+ Create New Contest'}
        </button>
      </div>
      
      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-purple-500">
          <h3 className="text-xl font-bold mb-4">Create Remix Contest</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Original Track URI</label>
              <input
                type="text"
                value={trackURI}
                onChange={(e) => setTrackURI(e.target.value)}
                placeholder="ipfs://QmOriginal... or https://..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Prize Amount (MON)</label>
              <input
                type="number"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
                min="1"
                step="1"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleCreateContest}
              disabled={loading || !trackURI || !prizeAmount}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-semibold"
            >
              {loading ? '⏳ Creating...' : 'Create Contest'}
            </button>
          </div>
        </div>
      )}
      
      {/* Loading */}
      {loading && contests.length === 0 && (
        <div className="text-center py-12 text-gray-400">Loading contests...</div>
      )}
      
      {/* No Contests */}
      {!loading && contests.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl mb-2">No contests yet</p>
          <p>Create the first one! 🎵</p>
        </div>
      )}
      
      {/* Contests */}
      <div className="space-y-6">
        {contests.map((contest) => (
          <div 
            key={contest.id}
            className={`p-6 rounded-lg border-2 ${
              contest.active 
                ? 'bg-gray-800 border-purple-500'
                : 'bg-gray-900 border-gray-700'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">Contest #{contest.id}</h3>
                <p className="text-sm text-gray-400">
                  Host: {contest.host.slice(0,6)}...{contest.host.slice(-4)}
                </p>
                <p className="text-sm text-purple-300 break-all">
                  Track: {contest.trackURI.slice(0,40)}...
                </p>
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  contest.active 
                    ? 'bg-green-900/40 text-green-300'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {contest.active ? '🟢 Active' : '⚫ Ended'}
                </div>
                <p className="text-xl font-bold text-yellow-400 mt-2">
                  🏆 {contest.prizeAmount} MON
                </p>
              </div>
            </div>
            
            {/* Upload Remix (Host only, no remix yet) */}
            {contest.active && account && contest.host.toLowerCase() === account.toLowerCase() && !contest.remixURI && (
              <div className="mb-4">
                {uploadingContestId === contest.id ? (
                  <div className="p-4 bg-gray-900 rounded border border-blue-500">
                    <h4 className="font-bold mb-3">Upload Remix</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Remix URI</label>
                        <input
                          type="text"
                          value={remixURI}
                          onChange={(e) => setRemixURI(e.target.value)}
                          placeholder="ipfs://QmRemix... or https://..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Payout Wallet Address
                          <span className="text-xs ml-2">(Who receives the prize)</span>
                        </label>
                        <input
                          type="text"
                          value={payoutWallet}
                          onChange={(e) => setPayoutWallet(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUploadRemix(contest.id)}
                          disabled={loading || !remixURI || !payoutWallet}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-semibold text-sm"
                        >
                          {loading ? '⏳ Uploading...' : 'Upload Remix'}
                        </button>
                        <button
                          onClick={() => {
                            setUploadingContestId(null);
                            setRemixURI('');
                            setPayoutWallet('');
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setUploadingContestId(contest.id)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
                  >
                    📤 Upload Remix
                  </button>
                )}
              </div>
            )}
            
            {/* Remix Display */}
            {contest.remixURI && (
              <div className="p-4 bg-gray-900 rounded border border-gray-700 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Remix</p>
                    <p className="text-xs text-gray-500 mb-2 break-all">{contest.remixURI}</p>
                    <p className="text-xs text-purple-300">
                      Payout: {contest.payoutWallet.slice(0,10)}...{contest.payoutWallet.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-400">{contest.voteCount}</p>
                      <p className="text-xs text-gray-500">votes</p>
                    </div>
                    {contest.active && !contest.userVoted && account && (
                      <button
                        onClick={() => handleVote(contest.id)}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-semibold"
                      >
                        🗳️ Vote
                      </button>
                    )}
                    {contest.userVoted && (
                      <div className="px-4 py-2 bg-gray-700 rounded text-sm">
                        ✓ Voted
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* End Contest (Host only) */}
            {contest.active && account && contest.host.toLowerCase() === account.toLowerCase() && contest.remixURI && (
              <button
                onClick={() => handleEndContest(contest.id)}
                disabled={loading}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-semibold"
              >
                {loading ? '⏳ Ending...' : '🏁 End Contest & Pay Prize'}
              </button>
            )}
            
            {/* Winner Display */}
            {!contest.active && contest.payoutWallet !== ethers.ZeroAddress && (
              <div className="mt-4 p-4 bg-yellow-900/20 border-2 border-yellow-500 rounded text-center">
                <p className="text-xl font-bold text-yellow-400 mb-2">🏆 Contest Ended!</p>
                <p className="text-sm text-gray-300 mb-1">
                  Winner: {contest.payoutWallet.slice(0,10)}...{contest.payoutWallet.slice(-8)}
                </p>
                <p className="text-sm text-yellow-300">
                  Prize of {contest.prizeAmount} MON paid on-chain ✓
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Votes: {contest.voteCount}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
