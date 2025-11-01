'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

/**
 * MVP Single Track Voting Component
 * Time-sensitive implementation for 40-minute demo
 * All features on ONE page: submit, vote, end, prize distribution
 */
export default function MVPTrackVoting() {
  const { signer, provider, account } = useWallet();
  
  // Contract instances
  const [contract, setContract] = useState(null);
  const [prizeTokenContract, setPrizeTokenContract] = useState(null);
  
  // Track state
  const [trackURI, setTrackURI] = useState('');
  const [host, setHost] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('0');
  const [isHost, setIsHost] = useState(false);
  
  // Voting state
  const [votingActive, setVotingActive] = useState(false);
  const [prizeDistributed, setPrizeDistributed] = useState(false);
  const [winner, setWinner] = useState('');
  const [winningRemixId, setWinningRemixId] = useState(0);
  
  // NEW: Enhanced winner data from VotingEnded event
  const [winnerVoteCount, setWinnerVoteCount] = useState(0);
  const [prizeDistributedAmount, setPrizeDistributedAmount] = useState('0');
  const [endVotingTxHash, setEndVotingTxHash] = useState('');
  const [prizeDistributionTxHash, setPrizeDistributionTxHash] = useState('');
  
  // NEW: Transaction state tracking
  const [txState, setTxState] = useState(''); // 'pending', 'confirming', 'confirmed', 'failed'
  const [showVictoryPanel, setShowVictoryPanel] = useState(false);
  
  // Remixes and votes
  const [remixes, setRemixes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [remixURI, setRemixURI] = useState('');
  const [allowanceChecked, setAllowanceChecked] = useState(false);
  const [hasAllowance, setHasAllowance] = useState(false);
  
  // Configuration
  const VOTING_ADDRESS = process.env.NEXT_PUBLIC_TRACK_VOTING_ADDRESS;
  const PRIZE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS;
  
  // ABIs
  const VOTING_ABI = [
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
    "function voterChoice(address _voter) view returns (uint256)",
    "event RemixSubmitted(uint256 indexed remixId, address indexed remixer, string remixURI)",
    "event VoteCast(address indexed voter, uint256 indexed remixId, uint256 newVoteCount)",
    "event VotingEnded(uint256 indexed winningRemixId, address indexed winner, uint256 voteCount)",
    "event PrizeDistributed(address indexed winner, uint256 amount)"
  ];
  
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
  ];

  // Initialize contracts
  useEffect(() => {
    if (!VOTING_ADDRESS) return;
    
    if (provider) {
      const votingContract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider);
      setContract(votingContract);
      loadData(votingContract);
      setupEventListeners(votingContract);
    }
    
    if (signer && PRIZE_TOKEN_ADDRESS) {
      const tokenContract = new ethers.Contract(PRIZE_TOKEN_ADDRESS, ERC20_ABI, signer);
      setPrizeTokenContract(tokenContract);
    }
  }, [provider, signer, account]);

  // Load all data
  const loadData = useCallback(async (votingContract) => {
    try {
      const [uri, hostAddr, prize, active, distributed, winnerAddr, winningId, count] = await Promise.all([
        votingContract.trackURI(),
        votingContract.host(),
        votingContract.prizeAmount(),
        votingContract.votingActive(),
        votingContract.prizeDistributed(),
        votingContract.winner(),
        votingContract.winningRemixId(),
        votingContract.remixCount()
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
        const voted = await votingContract.hasUserVoted(account);
        setHasVoted(voted);
        if (voted) {
          const choice = await votingContract.voterChoice(account);
          setUserVote(Number(choice));
        }
      }
      
      await loadRemixes(votingContract);
      
      // Check allowance if user is host
      if (account && account.toLowerCase() === hostAddr.toLowerCase() && PRIZE_TOKEN_ADDRESS) {
        await checkAllowance(hostAddr, prize);
      }
    } catch (error) {
      console.error('Load data error:', error);
      setTxStatus(`❌ Error loading data: ${error.message}`);
    }
  }, [account, PRIZE_TOKEN_ADDRESS]);

  // Load remixes
  const loadRemixes = async (votingContract) => {
    try {
      const [ids, remixers, uris, votes] = await votingContract.getAllRemixes();
      const remixList = ids.map((id, idx) => ({
        id: Number(id),
        remixer: remixers[idx],
        uri: uris[idx],
        votes: Number(votes[idx])
      }));
      remixList.sort((a, b) => b.votes - a.votes);
      setRemixes(remixList);
    } catch (error) {
      console.error('Load remixes error:', error);
    }
  };

  // Check token allowance
  const checkAllowance = async (hostAddr, requiredAmount) => {
    if (!prizeTokenContract) return;
    try {
      const allowance = await prizeTokenContract.allowance(hostAddr, VOTING_ADDRESS);
      setHasAllowance(allowance >= requiredAmount);
      setAllowanceChecked(true);
    } catch (error) {
      console.error('Allowance check error:', error);
    }
  };

  // Setup event listeners with enhanced VotingEnded handling
  const setupEventListeners = (votingContract) => {
    // RemixSubmitted event
    votingContract.on('RemixSubmitted', (remixId, remixer, uri) => {
      console.log('✅ Remix submitted:', remixId, remixer);
      loadRemixes(votingContract);
      setTxStatus(`✅ Remix #${remixId} submitted successfully!`);
    });
    
    // VoteCast event
    votingContract.on('VoteCast', (voter, remixId, voteCount) => {
      console.log('✅ Vote cast:', voter, remixId, voteCount);
      loadRemixes(votingContract);
      if (account && voter.toLowerCase() === account.toLowerCase()) {
        setHasVoted(true);
        setUserVote(Number(remixId));
        setTxStatus(`✅ Your vote for Remix #${remixId} recorded!`);
      }
    });
    
    // ENHANCED: VotingEnded event with complete winner data
    votingContract.on('VotingEnded', async (winningId, winnerAddr, voteCount, event) => {
      console.log('🏆 VotingEnded event received:', {
        winningId: winningId.toString(),
        winnerAddr,
        voteCount: voteCount.toString()
      });
      
      try {
        // Update state with winner information
        setVotingActive(false);
        setWinner(winnerAddr);
        setWinningRemixId(Number(winningId));
        setWinnerVoteCount(Number(voteCount));
        
        // Get transaction hash from event
        const txHash = event.log.transactionHash;
        setEndVotingTxHash(txHash);
        
        // Show transaction state
        setTxState('confirming');
        setTxStatus(`🏆 Voting ended! Winner: Remix #${winningId} with ${voteCount} votes. Confirming transaction...`);
        
        // Wait for transaction confirmation
        const tx = await event.log.getTransaction();
        const receipt = await tx.wait();
        
        setTxState('confirmed');
        console.log('✅ VotingEnded transaction confirmed:', receipt.hash);
        
        // Show victory panel
        setShowVictoryPanel(true);
        setTxStatus(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
        
      } catch (error) {
        console.error('Error processing VotingEnded event:', error);
        setTxState('failed');
        setTxStatus(`❌ Error processing voting end: ${error.message}`);
      }
    });
    
    // ENHANCED: PrizeDistributed event with transaction tracking
    votingContract.on('PrizeDistributed', async (winnerAddr, amount, event) => {
      console.log('💰 PrizeDistributed event received:', {
        winner: winnerAddr,
        amount: ethers.formatEther(amount)
      });
      
      try {
        setPrizeDistributed(true);
        setPrizeDistributedAmount(ethers.formatEther(amount));
        
        // Get transaction hash
        const txHash = event.log.transactionHash;
        setPrizeDistributionTxHash(txHash);
        
        // Update status
        setTxStatus(`💰 Prize distributed! ${ethers.formatEther(amount)} MON sent to winner!`);
        
        // Wait for confirmation
        const tx = await event.log.getTransaction();
        const receipt = await tx.wait();
        
        console.log('✅ Prize distribution confirmed:', receipt.hash);
        setTxStatus(`✅ Prize sent successfully! TX: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}`);
        
      } catch (error) {
        console.error('Error processing PrizeDistributed event:', error);
      }
    });
    
    return () => votingContract.removeAllListeners();
  };

  // Submit remix
  const handleSubmitRemix = async () => {
    if (!contract || !signer || !remixURI) return;
    setLoading(true);
    setTxStatus('📤 Submitting remix...');
    
    try {
      const votingWithSigner = contract.connect(signer);
      const tx = await votingWithSigner.submitRemix(remixURI);
      setTxStatus('⏳ Transaction pending...');
      await tx.wait();
      setRemixURI('');
      setShowSubmitForm(false);
      // Event listener will update UI
    } catch (error) {
      console.error('Submit error:', error);
      setTxStatus(`❌ Submit failed: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Vote
  const handleVote = async (remixId) => {
    if (!contract || !signer) return;
    setLoading(true);
    setTxStatus(`🗳️ Voting for Remix #${remixId}...`);
    
    try {
      const votingWithSigner = contract.connect(signer);
      const tx = await votingWithSigner.vote(remixId);
      setTxStatus('⏳ Transaction pending...');
      await tx.wait();
      // Event listener will update UI
    } catch (error) {
      console.error('Vote error:', error);
      setTxStatus(`❌ Vote failed: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Approve tokens
  const handleApprove = async () => {
    if (!prizeTokenContract) return;
    setLoading(true);
    setTxStatus('⏳ Approving prize tokens...');
    
    try {
      const amount = ethers.parseEther(prizeAmount);
      const tx = await prizeTokenContract.approve(VOTING_ADDRESS, amount);
      setTxStatus('⏳ Approval pending...');
      await tx.wait();
      setHasAllowance(true);
      setTxStatus('✅ Tokens approved! You can now end voting.');
    } catch (error) {
      console.error('Approve error:', error);
      setTxStatus(`❌ Approval failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ENHANCED: End voting with real-time transaction state tracking
  const handleEndVoting = async () => {
    if (!contract || !signer) return;
    
    // Check allowance first
    if (!hasAllowance) {
      setTxStatus('⚠️ Please approve tokens first!');
      return;
    }
    
    setLoading(true);
    setTxState('pending');
    setTxStatus('🏁 Submitting transaction to end voting...');
    
    try {
      const votingWithSigner = contract.connect(signer);
      
      // Submit transaction
      console.log('📤 Submitting endVoting transaction...');
      const tx = await votingWithSigner.endVoting();
      
      setTxState('confirming');
      setEndVotingTxHash(tx.hash);
      setTxStatus(`⏳ Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}\n⏳ Waiting for confirmation (this will select winner and distribute prize)...`);
      
      console.log('⏳ Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      setTxState('confirmed');
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      setTxStatus(`✅ Transaction confirmed in block ${receipt.blockNumber}! Processing events...`);
      
      // Parse logs to extract VotingEnded event data
      const votingEndedEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'VotingEnded';
        } catch {
          return false;
        }
      });
      
      if (votingEndedEvent) {
        const parsed = contract.interface.parseLog(votingEndedEvent);
        const [winningId, winnerAddr, voteCount] = parsed.args;
        
        console.log('🏆 VotingEnded event data:', {
          winnerId: winningId.toString(),
          winner: winnerAddr,
          votes: voteCount.toString()
        });
        
        // Update state with complete winner data
        setWinningRemixId(Number(winningId));
        setWinner(winnerAddr);
        setWinnerVoteCount(Number(voteCount));
        setShowVictoryPanel(true);
        setVotingActive(false);
      }
      
      // Parse PrizeDistributed event
      const prizeEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'PrizeDistributed';
        } catch {
          return false;
        }
      });
      
      if (prizeEvent) {
        const parsed = contract.interface.parseLog(prizeEvent);
        const [winnerAddr, amount] = parsed.args;
        
        console.log('💰 PrizeDistributed event data:', {
          winner: winnerAddr,
          amount: ethers.formatEther(amount)
        });
        
        setPrizeDistributed(true);
        setPrizeDistributedAmount(ethers.formatEther(amount));
        setPrizeDistributionTxHash(receipt.hash);
        
        setTxStatus(`✅ Success! Winner received ${ethers.formatEther(amount)} MON tokens!`);
      }
      
      // Event listeners will also update UI in real-time
    } catch (error) {
      console.error('❌ End voting error:', error);
      setTxState('failed');
      setTxStatus(`❌ Transaction failed: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 rounded-lg p-8 mb-6 shadow-2xl">
        <h1 className="text-4xl font-bold mb-2">🎵 MVP Track Voting</h1>
        <p className="text-gray-300 text-lg">Single-page voting with instant prize distribution</p>
      </div>

      {/* ENHANCED: Transaction State Banner with Real-time Progress */}
      {txState && txState !== 'confirmed' && (
        <div className={`mb-6 p-6 rounded-lg border-2 ${
          txState === 'pending' ? 'bg-blue-900/50 border-blue-500 animate-pulse' :
          txState === 'confirming' ? 'bg-yellow-900/50 border-yellow-500 animate-pulse' :
          txState === 'failed' ? 'bg-red-900/50 border-red-500' :
          'bg-gray-900/50 border-gray-500'
        }`}>
          <div className="flex items-center gap-4">
            {/* Animated Spinner */}
            {(txState === 'pending' || txState === 'confirming') && (
              <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            )}
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                {txState === 'pending' && '📤 Transaction Pending...'}
                {txState === 'confirming' && '⏳ Confirming Transaction...'}
                {txState === 'failed' && '❌ Transaction Failed'}
              </h3>
              
              <p className="text-sm text-gray-300 mb-2">
                {txState === 'pending' && 'Waiting for wallet confirmation. Please check MetaMask.'}
                {txState === 'confirming' && 'Transaction submitted to blockchain. Waiting for confirmation...'}
                {txState === 'failed' && 'Transaction was rejected or failed. Please try again.'}
              </p>
              
              {endVotingTxHash && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">TX Hash:</span>
                  <code className="text-xs bg-black/50 px-2 py-1 rounded font-mono">
                    {endVotingTxHash.slice(0, 10)}...{endVotingTxHash.slice(-8)}
                  </code>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${endVotingTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    View on Explorer
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Alert */}
      {txStatus && (
        <div className={`mb-6 p-4 rounded-lg font-medium whitespace-pre-line ${
          txStatus.includes('❌') ? 'bg-red-900/50 text-red-200 border border-red-500' :
          txStatus.includes('✅') ? 'bg-green-900/50 text-green-200 border border-green-500' :
          txStatus.includes('🏆') ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-500' :
          txStatus.includes('💰') ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-500' :
          'bg-blue-900/50 text-blue-200 border border-blue-500'
        }`}>
          {txStatus}
        </div>
      )}

      {/* Track Info Card */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">📀 Track Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Host</label>
            <p className="font-mono text-sm">
              {host ? `${host.slice(0, 8)}...${host.slice(-6)}` : 'Loading...'}
              {isHost && <span className="ml-2 px-2 py-1 bg-purple-600 rounded text-xs">YOU</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Prize Pool</label>
            <p className="text-3xl font-bold text-yellow-400">{prizeAmount} MON</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Status</label>
            <div className="flex gap-2">
              {votingActive ? (
                <span className="px-3 py-1 bg-green-600 rounded-full text-sm font-bold">
                  🟢 ACTIVE
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">
                  🔴 ENDED
                </span>
              )}
              {prizeDistributed && (
                <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">
                  💰 PAID
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ENHANCED: Victory Panel with Complete Winner Data */}
      {showVictoryPanel && !votingActive && winner && winner !== ethers.ZeroAddress && (
        <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 border-4 border-yellow-300 rounded-xl p-8 mb-6 shadow-2xl">
          {/* Trophy Header */}
          <div className="flex items-center justify-center mb-6">
            <span className="text-8xl animate-bounce">🏆</span>
          </div>
          
          {/* Winner Title */}
          <h2 className="text-5xl font-black text-center mb-6 text-white drop-shadow-lg">
            VOTING COMPLETE!
          </h2>
          
          {/* Winner Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 rounded-lg p-6 backdrop-blur-sm">
            {/* Winner Remix ID */}
            <div className="bg-white/10 rounded-lg p-4 border-2 border-yellow-300">
              <label className="text-sm font-bold text-yellow-200 uppercase tracking-wide block mb-2">
                🥇 Winning Remix
              </label>
              <p className="text-4xl font-black text-white">
                #{winningRemixId}
              </p>
            </div>
            
            {/* Winner Address */}
            <div className="bg-white/10 rounded-lg p-4 border-2 border-yellow-300">
              <label className="text-sm font-bold text-yellow-200 uppercase tracking-wide block mb-2">
                👤 Winner Address
              </label>
              <p className="text-lg font-mono font-bold text-white break-all">
                {winner}
              </p>
              <p className="text-sm text-yellow-200 mt-1">
                {winner.slice(0, 6)}...{winner.slice(-4)}
              </p>
            </div>
            
            {/* Vote Count */}
            <div className="bg-white/10 rounded-lg p-4 border-2 border-yellow-300">
              <label className="text-sm font-bold text-yellow-200 uppercase tracking-wide block mb-2">
                🗳️ Votes Received
              </label>
              <p className="text-4xl font-black text-white">
                {winnerVoteCount}
              </p>
            </div>
            
            {/* Prize Amount */}
            <div className="bg-white/10 rounded-lg p-4 border-2 border-yellow-300">
              <label className="text-sm font-bold text-yellow-200 uppercase tracking-wide block mb-2">
                💰 Prize Distributed
              </label>
              <p className="text-4xl font-black text-green-300">
                {prizeDistributedAmount || prizeAmount} MON
              </p>
              {prizeDistributed && (
                <p className="text-sm text-green-300 mt-1 font-bold">
                  ✅ Sent Successfully!
                </p>
              )}
            </div>
          </div>
          
          {/* Transaction Details */}
          {endVotingTxHash && (
            <div className="mt-6 bg-black/40 rounded-lg p-4 border border-yellow-300/50">
              <h3 className="text-xl font-bold text-yellow-200 mb-3">📋 Transaction Details</h3>
              
              {/* End Voting TX */}
              <div className="mb-3">
                <label className="text-sm text-yellow-200 font-bold block mb-1">
                  🏁 End Voting Transaction:
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono bg-black/50 px-3 py-2 rounded flex-1 text-white break-all">
                    {endVotingTxHash}
                  </p>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${endVotingTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold text-sm whitespace-nowrap transition"
                  >
                    View on Explorer 🔗
                  </a>
                </div>
              </div>
              
              {/* Prize Distribution TX (if different) */}
              {prizeDistributionTxHash && prizeDistributionTxHash !== endVotingTxHash && (
                <div>
                  <label className="text-sm text-yellow-200 font-bold block mb-1">
                    💰 Prize Distribution Transaction:
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono bg-black/50 px-3 py-2 rounded flex-1 text-white break-all">
                      {prizeDistributionTxHash}
                    </p>
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${prizeDistributionTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-sm whitespace-nowrap transition"
                    >
                      View on Explorer 🔗
                    </a>
                  </div>
                </div>
              )}
              
              {/* Transaction State Indicator */}
              {txState && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-bold text-yellow-200">Status:</span>
                  {txState === 'pending' && (
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-bold animate-pulse">
                      ⏳ Pending...
                    </span>
                  )}
                  {txState === 'confirming' && (
                    <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold animate-pulse">
                      ⏳ Confirming...
                    </span>
                  )}
                  {txState === 'confirmed' && (
                    <span className="px-3 py-1 bg-green-600 rounded-full text-sm font-bold">
                      ✅ Confirmed
                    </span>
                  )}
                  {txState === 'failed' && (
                    <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">
                      ❌ Failed
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Celebration Message */}
          <div className="mt-6 text-center">
            <p className="text-2xl font-bold text-white drop-shadow-lg">
              🎉 Congratulations to the winner! 🎉
            </p>
          </div>
        </div>
      )}

      {/* Host Actions */}
      {isHost && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-purple-500">
          <h3 className="text-xl font-bold mb-4 text-purple-400">🎛️ Host Controls</h3>
          
          {/* Allowance Check */}
          {votingActive && !hasAllowance && allowanceChecked && (
            <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-500 rounded">
              <p className="text-yellow-200 mb-3">
                ⚠️ You need to approve the contract to spend {prizeAmount} MON tokens
              </p>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition disabled:opacity-50"
              >
                Approve {prizeAmount} MON
              </button>
            </div>
          )}
          
          {/* End Voting Button */}
          {votingActive && remixes.length > 0 && (
            <button
              onClick={handleEndVoting}
              disabled={loading || !hasAllowance}
              className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!hasAllowance ? '🔒 Approve Tokens First' : '🏁 End Voting & Distribute Prize'}
            </button>
          )}
        </div>
      )}

      {/* Submit Remix Button */}
      {votingActive && !isHost && (
        <div className="mb-6">
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg transition"
          >
            📤 Submit Your Remix
          </button>
        </div>
      )}

      {/* Submit Form */}
      {showSubmitForm && votingActive && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Submit Your Remix</h3>
          <input
            type="text"
            value={remixURI}
            onChange={(e) => setRemixURI(e.target.value)}
            placeholder="ipfs://QmYourRemixHash or http://..."
            className="w-full px-4 py-3 bg-gray-900 rounded-lg mb-3 text-lg"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSubmitRemix}
              disabled={loading || !remixURI}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={() => setShowSubmitForm(false)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Remixes List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">
          🎵 Remixes ({remixes.length})
        </h2>

        {remixes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-2">No remixes yet</p>
            <p>Be the first to submit!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {remixes.map((remix, index) => (
              <div
                key={remix.id}
                className={`p-5 rounded-lg border-2 transition ${
                  remix.id === winningRemixId && !votingActive
                    ? 'border-yellow-500 bg-yellow-900/30 shadow-lg shadow-yellow-500/50'
                    : userVote === remix.id
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-700 bg-gray-900'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Medals */}
                      {index === 0 && <span className="text-3xl">🥇</span>}
                      {index === 1 && <span className="text-3xl">🥈</span>}
                      {index === 2 && <span className="text-3xl">🥉</span>}
                      
                      <div>
                        <span className="text-lg font-bold">Remix #{remix.id}</span>
                        {remix.id === winningRemixId && !votingActive && (
                          <span className="ml-2 px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">
                            🏆 WINNER
                          </span>
                        )}
                        {userVote === remix.id && (
                          <span className="ml-2 px-3 py-1 bg-green-600 rounded-full text-sm font-bold">
                            ✓ YOUR VOTE
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 font-mono mb-2">
                      by {remix.remixer.slice(0, 10)}...{remix.remixer.slice(-8)}
                    </p>
                    
                    <p className="text-xs text-gray-500 break-all">{remix.uri}</p>
                  </div>

                  {/* Vote Count */}
                  <div className="text-right ml-4">
                    <div className="text-4xl font-bold text-purple-400">{remix.votes}</div>
                    <div className="text-sm text-gray-400">votes</div>
                  </div>
                </div>

                {/* Vote Button */}
                {votingActive && !hasVoted && !isHost && (
                  <button
                    onClick={() => handleVote(remix.id)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition disabled:opacity-50"
                  >
                    🗳️ Vote for This Remix
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
        <h3 className="font-bold mb-2 text-blue-200">ℹ️ How It Works</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Remixers submit their remix URIs</li>
          <li>• Users vote (one vote per wallet)</li>
          <li>• Host approves MON tokens</li>
          <li>• Host ends voting</li>
          <li>• Winner receives prize automatically in same transaction!</li>
          <li>• <strong>Real-time updates:</strong> All events are tracked live via blockchain listeners</li>
          <li>• <strong>Transaction tracking:</strong> See pending → confirming → confirmed states</li>
        </ul>
      </div>
    </div>
  );
}
