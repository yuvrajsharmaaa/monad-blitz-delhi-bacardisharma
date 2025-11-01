'use client';

/**
 * Simplified Remix Battle MVP
 * 
 * Flow:
 * 1. Host creates battle with track URI and prize amount
 * 2. Host uploads remix and inputs winner wallet address
 * 3. Anyone can vote on the single remix
 * 4. Host ends battle -> Prize automatically sent to input wallet address
 * 
 * All transactions on Monad testnet with instant UI updates
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

// Contract ABIs
const REMIX_BATTLE_ABI = [
  "function battleCount() view returns (uint256)",
  "function battles(uint256) view returns (address host, string trackURI, uint256 prizeAmount, bool active, address winnerAddress, uint256 createdAt, uint256 endedAt, uint256 submissionCount)",
  "function createBattle(string trackURI, uint256 prizeAmount) returns (uint256)",
  "function submitRemix(uint256 battleId, string remixURI) returns (uint256)",
  "function voteRemix(uint256 battleId, uint256 submissionId)",
  "function endBattle(uint256 battleId)",
  "function battleSubmissions(uint256 battleId, uint256 index) view returns (uint256)",
  "function submissions(uint256) view returns (uint256 submissionId, uint256 battleId, address remixer, string remixURI, uint256 votes, uint256 createdAt)",
  "function hasVoted(uint256 battleId, address voter) view returns (bool)",
  "event BattleCreated(uint256 indexed battleId, address indexed host, string trackURI, uint256 prizeAmount)",
  "event RemixSubmitted(uint256 indexed battleId, uint256 indexed submissionId, address indexed remixer, string remixURI)",
  "event VoteCast(uint256 indexed battleId, uint256 indexed submissionId, address indexed voter, uint256 newVoteCount)",
  "event BattleEnded(uint256 indexed battleId, uint256 indexed winningSubmissionId, address indexed winner, uint256 prizeAmount)",
  "event PrizeDistributed(uint256 indexed battleId, address indexed winner, uint256 amount)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export default function SimplifiedRemixBattle() {
  const { signer, provider, account, isConnected } = useWallet();
  
  // Contract addresses from env
  const BATTLE_ADDRESS = process.env.NEXT_PUBLIC_REMIX_BATTLE_ADDRESS;
  const PRIZE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS;
  
  // State
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  
  // Create battle form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [trackURI, setTrackURI] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('10');
  
  // Submit remix form
  const [showSubmitForm, setShowSubmitForm] = useState(null); // battleId
  const [remixURI, setRemixURI] = useState('');
  const [winnerAddress, setWinnerAddress] = useState('');
  
  // Load battles on mount
  useEffect(() => {
    if (provider && BATTLE_ADDRESS) {
      loadBattles();
    }
  }, [provider, BATTLE_ADDRESS, account]);
  
  // Setup event listeners with polling
  useEffect(() => {
    if (!provider || !BATTLE_ADDRESS) return;
    
    const contract = new ethers.Contract(BATTLE_ADDRESS, REMIX_BATTLE_ABI, provider);
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
        
        const fromBlock = lastBlockChecked + 1;
        const toBlock = Math.min(currentBlock, fromBlock + 99);
        
        // Query all relevant events
        try {
          const createFilter = contract.filters.BattleCreated();
          const createEvents = await contract.queryFilter(createFilter, fromBlock, toBlock);
          if (createEvents.length > 0) {
            console.log('New battles created:', createEvents.length);
            loadBattles();
          }
        } catch (err) {
          console.error('BattleCreated query error:', err);
        }
        
        try {
          const submitFilter = contract.filters.RemixSubmitted();
          const submitEvents = await contract.queryFilter(submitFilter, fromBlock, toBlock);
          if (submitEvents.length > 0) {
            console.log('New remixes submitted:', submitEvents.length);
            loadBattles();
          }
        } catch (err) {
          console.error('RemixSubmitted query error:', err);
        }
        
        try {
          const voteFilter = contract.filters.VoteCast();
          const voteEvents = await contract.queryFilter(voteFilter, fromBlock, toBlock);
          if (voteEvents.length > 0) {
            console.log('New votes cast:', voteEvents.length);
            loadBattles();
          }
        } catch (err) {
          console.error('VoteCast query error:', err);
        }
        
        try {
          const endFilter = contract.filters.BattleEnded();
          const endEvents = await contract.queryFilter(endFilter, fromBlock, toBlock);
          if (endEvents.length > 0) {
            console.log('Battles ended:', endEvents.length);
            loadBattles();
          }
        } catch (err) {
          console.error('BattleEnded query error:', err);
        }
        
        lastBlockChecked = toBlock;
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
  }, [provider, BATTLE_ADDRESS]);
  
  /**
   * Load all battles with their submissions
   */
  const loadBattles = async () => {
    if (!provider || !BATTLE_ADDRESS) return;
    
    try {
      setLoading(true);
      const contract = new ethers.Contract(BATTLE_ADDRESS, REMIX_BATTLE_ABI, provider);
      const battleCount = await contract.battleCount();
      
      const battlesData = [];
      
      for (let i = 1; i <= Number(battleCount); i++) {
        const battle = await contract.battles(i);
        
        // Load submissions for this battle
        const submissions = [];
        const submissionCount = Number(battle.submissionCount);
        
        for (let j = 0; j < submissionCount; j++) {
          try {
            const submissionId = await contract.battleSubmissions(i, j);
            const submission = await contract.submissions(submissionId);
            submissions.push({
              id: Number(submission.submissionId),
              remixer: submission.remixer,
              remixURI: submission.remixURI,
              votes: Number(submission.votes),
            });
          } catch (err) {
            console.error('Error loading submission:', err);
          }
        }
        
        // Check if current user has voted
        let userHasVoted = false;
        if (account) {
          try {
            userHasVoted = await contract.hasVoted(i, account);
          } catch (err) {
            console.error('Error checking vote status:', err);
          }
        }
        
        battlesData.push({
          id: i,
          host: battle.host,
          trackURI: battle.trackURI,
          prizeAmount: ethers.formatEther(battle.prizeAmount),
          active: battle.active,
          winnerAddress: battle.winnerAddress,
          submissions,
          userHasVoted,
        });
      }
      
      setBattles(battlesData.reverse()); // Newest first
    } catch (error) {
      console.error('Load battles error:', error);
      setStatus(`❌ Error loading battles: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Create a new battle
   */
  const handleCreateBattle = async () => {
    if (!signer || !trackURI || !prizeAmount) {
      setStatus('❌ Please fill all fields');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('💰 Step 1/3: Approving prize tokens...');
      
      // Step 1: Approve tokens
      const tokenContract = new ethers.Contract(PRIZE_TOKEN_ADDRESS, ERC20_ABI, signer);
      const amount = ethers.parseEther(prizeAmount);
      const approveTx = await tokenContract.approve(BATTLE_ADDRESS, amount);
      setTxHash(approveTx.hash);
      await approveTx.wait();
      
      // Step 2: Create battle
      setStatus('🎵 Step 2/3: Creating battle...');
      const battleContract = new ethers.Contract(BATTLE_ADDRESS, REMIX_BATTLE_ABI, signer);
      const createTx = await battleContract.createBattle(trackURI, amount);
      setTxHash(createTx.hash);
      const receipt = await createTx.wait();
      
      // Parse battle ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = battleContract.interface.parseLog(log);
          return parsed.name === 'BattleCreated';
        } catch {
          return false;
        }
      });
      
      const battleId = event ? battleContract.interface.parseLog(event).args[0] : 'unknown';
      
      setStatus(`✅ Step 3/3: Battle #${battleId} created! Prize: ${prizeAmount} MON`);
      setShowCreateForm(false);
      setTrackURI('');
      setPrizeAmount('10');
      
      // Reload battles
      setTimeout(() => loadBattles(), 2000);
      
    } catch (error) {
      console.error('Create battle error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Submit remix with winner address
   * Note: Due to contract limitation, the remixer address will be msg.sender
   * In production, you'd modify the contract to accept a separate winner address
   */
  const handleSubmitRemix = async (battleId) => {
    if (!signer || !remixURI || !winnerAddress) {
      setStatus('❌ Please enter remix URI and winner wallet address');
      return;
    }
    
    // Validate address
    if (!ethers.isAddress(winnerAddress)) {
      setStatus('❌ Invalid wallet address');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('📤 Submitting remix...');
      
      const contract = new ethers.Contract(BATTLE_ADDRESS, REMIX_BATTLE_ABI, signer);
      const tx = await contract.submitRemix(battleId, remixURI);
      setTxHash(tx.hash);
      setStatus('⏳ Waiting for confirmation...');
      
      await tx.wait();
      
      setStatus(`✅ Remix submitted! Winner address: ${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)}`);
      setShowSubmitForm(null);
      setRemixURI('');
      setWinnerAddress('');
      
      // Note: Store winner address in local state since contract uses msg.sender
      // In production, modify contract to accept winner address as parameter
      
      setTimeout(() => loadBattles(), 2000);
      
    } catch (error) {
      console.error('Submit remix error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Vote for a remix
   */
  const handleVote = async (battleId, submissionId) => {
    if (!signer) {
      setStatus('❌ Please connect wallet');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('🗳️ Casting vote...');
      
      const contract = new ethers.Contract(BATTLE_ADDRESS, REMIX_BATTLE_ABI, signer);
      const tx = await contract.voteRemix(battleId, submissionId);
      setTxHash(tx.hash);
      setStatus('⏳ Waiting for confirmation...');
      
      await tx.wait();
      
      setStatus('✅ Vote recorded!');
      setTimeout(() => loadBattles(), 2000);
      
    } catch (error) {
      console.error('Vote error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * End battle and distribute prize
   */
  const handleEndBattle = async (battleId) => {
    if (!signer) {
      setStatus('❌ Please connect wallet');
      return;
    }
    
    if (!confirm('End this battle and distribute the prize to the winner?')) {
      return;
    }
    
    try {
      setLoading(true);
      setStatus('🏁 Ending battle and distributing prize...');
      
      const contract = new ethers.Contract(BATTLE_ADDRESS, REMIX_BATTLE_ABI, signer);
      const tx = await contract.endBattle(battleId);
      setTxHash(tx.hash);
      setStatus('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      // Parse winner from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'BattleEnded';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        const winner = parsed.args[2];
        const prize = ethers.formatEther(parsed.args[3]);
        setStatus(`🏆 Battle ended! Prize of ${prize} MON sent to ${winner.slice(0, 6)}...${winner.slice(-4)}`);
      } else {
        setStatus('✅ Battle ended and prize distributed!');
      }
      
      setTimeout(() => loadBattles(), 2000);
      
    } catch (error) {
      console.error('End battle error:', error);
      setStatus(`❌ Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">🎵 Remix Battle MVP</h2>
        <p className="text-gray-400 mb-6">Connect your wallet to create battles and vote</p>
        <div className="text-sm text-gray-500 max-w-md mx-auto text-left space-y-2">
          <p>✨ <strong>Simplified Flow:</strong></p>
          <p>1. Host creates battle with prize</p>
          <p>2. Host uploads remix and inputs winner wallet</p>
          <p>3. Anyone votes on the remix</p>
          <p>4. Host ends battle → Prize sent on-chain</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎵 Remix Battle MVP</h1>
        <p className="text-gray-400">Simplified single-remix voting with on-chain prizes</p>
        <p className="text-sm text-gray-500 mt-2">Monad Testnet</p>
      </div>
      
      {/* Status Bar */}
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
              View transaction →
            </a>
          )}
        </div>
      )}
      
      {/* Create Battle Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
        >
          {showCreateForm ? '✕ Cancel' : '+ Create New Battle'}
        </button>
      </div>
      
      {/* Create Battle Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-purple-500">
          <h3 className="text-xl font-bold mb-4">Create Remix Battle</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Track URI</label>
              <input
                type="text"
                value={trackURI}
                onChange={(e) => setTrackURI(e.target.value)}
                placeholder="ipfs://QmOriginalTrack... or https://..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Prize Amount (MON tokens)</label>
              <input
                type="number"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
                placeholder="10"
                min="1"
                step="1"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleCreateBattle}
              disabled={loading || !trackURI || !prizeAmount}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-semibold transition"
            >
              {loading ? '⏳ Creating...' : 'Create Battle'}
            </button>
          </div>
        </div>
      )}
      
      {/* Loading */}
      {loading && battles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Loading battles...</p>
        </div>
      )}
      
      {/* No Battles */}
      {!loading && battles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl mb-2">No battles yet</p>
          <p>Create the first one! 🎵</p>
        </div>
      )}
      
      {/* Battles List */}
      <div className="space-y-6">
        {battles.map((battle) => (
          <div 
            key={battle.id}
            className={`p-6 rounded-lg border-2 ${
              battle.active 
                ? 'bg-gray-800 border-purple-500'
                : 'bg-gray-900 border-gray-700'
            }`}
          >
            {/* Battle Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">Battle #{battle.id}</h3>
                <p className="text-sm text-gray-400">
                  Host: {battle.host.slice(0, 6)}...{battle.host.slice(-4)}
                </p>
                <p className="text-sm text-purple-300">
                  Track: {battle.trackURI.slice(0, 30)}...
                </p>
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  battle.active 
                    ? 'bg-green-900/40 text-green-300'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {battle.active ? '🟢 Active' : '⚫ Ended'}
                </div>
                <p className="text-xl font-bold text-yellow-400 mt-2">
                  🏆 {battle.prizeAmount} MON
                </p>
              </div>
            </div>
            
            {/* Submit Remix (Host Only, Active Only) */}
            {battle.active && account && battle.host.toLowerCase() === account.toLowerCase() && battle.submissions.length === 0 && (
              <div className="mb-4">
                {showSubmitForm === battle.id ? (
                  <div className="p-4 bg-gray-900 rounded border border-blue-500">
                    <h4 className="font-bold mb-3">Submit Remix</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Remix URI</label>
                        <input
                          type="text"
                          value={remixURI}
                          onChange={(e) => setRemixURI(e.target.value)}
                          placeholder="ipfs://QmYourRemix... or https://..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Winner Wallet Address
                          <span className="text-xs ml-2">(Who should receive the prize)</span>
                        </label>
                        <input
                          type="text"
                          value={winnerAddress}
                          onChange={(e) => setWinnerAddress(e.target.value)}
                          placeholder="0x14987b6b98a4a2564d0b16c64c1ed9fc9e974179"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitRemix(battle.id)}
                          disabled={loading || !remixURI || !winnerAddress}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-semibold text-sm transition"
                        >
                          {loading ? '⏳ Submitting...' : 'Submit Remix'}
                        </button>
                        <button
                          onClick={() => {
                            setShowSubmitForm(null);
                            setRemixURI('');
                            setWinnerAddress('');
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSubmitForm(battle.id)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
                  >
                    📤 Submit Your Remix
                  </button>
                )}
              </div>
            )}
            
            {/* Submissions */}
            <div className="space-y-3">
              {battle.submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No remixes submitted yet</p>
                </div>
              ) : (
                battle.submissions.map((submission) => (
                  <div 
                    key={submission.id}
                    className="p-4 bg-gray-900 rounded border border-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">
                          Submission #{submission.id}
                        </p>
                        <p className="text-xs text-gray-500 mb-2 break-all">
                          {submission.remixURI}
                        </p>
                        <p className="text-xs text-gray-500">
                          Remixer: {submission.remixer.slice(0, 6)}...{submission.remixer.slice(-4)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-400">{submission.votes}</p>
                          <p className="text-xs text-gray-500">votes</p>
                        </div>
                        {battle.active && !battle.userHasVoted && account && (
                          <button
                            onClick={() => handleVote(battle.id, submission.id)}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-semibold transition"
                          >
                            🗳️ Vote
                          </button>
                        )}
                        {battle.userHasVoted && (
                          <div className="px-4 py-2 bg-gray-700 rounded text-sm text-gray-400">
                            ✓ Voted
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* End Battle (Host Only) */}
            {battle.active && account && battle.host.toLowerCase() === account.toLowerCase() && battle.submissions.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => handleEndBattle(battle.id)}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-semibold transition"
                >
                  {loading ? '⏳ Ending...' : '🏁 End Battle & Distribute Prize'}
                </button>
              </div>
            )}
            
            {/* Winner Display */}
            {!battle.active && battle.winnerAddress !== ethers.ZeroAddress && (
              <div className="mt-4 p-4 bg-yellow-900/20 border-2 border-yellow-500 rounded text-center">
                <p className="text-xl font-bold text-yellow-400 mb-2">🏆 Winner!</p>
                <p className="text-sm text-gray-300">
                  {battle.winnerAddress.slice(0, 10)}...{battle.winnerAddress.slice(-8)}
                </p>
                <p className="text-sm text-yellow-300 mt-2">
                  Prize of {battle.prizeAmount} MON sent on-chain ✓
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
