'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const MULTI_REMIX_ABI = [
  "function createContest(string trackURI, uint256 prizeAmount) returns (uint256)",
  "function submitRemix(uint256 contestId, string remixURI, address payoutWallet) returns (uint256)",
  "function vote(uint256 contestId, uint256 submissionId)",
  "function endContestAndPay(uint256 contestId)",
  "function getContest(uint256 contestId) view returns (uint256 id, address host, string trackURI, uint256 prizeAmount, bool active, uint256 createdAt, uint256 endedAt, uint256 winningSubmissionId)",
  "function getSubmission(uint256 submissionId) view returns (uint256 id, uint256 contestId, address submitter, string remixURI, address payoutWallet, uint256 voteCount, uint256 createdAt)",
  "function getContestSubmissions(uint256 contestId) view returns (uint256[])",
  "function checkVoted(uint256 contestId, address voter) view returns (bool)",
  "function contestCount() view returns (uint256)",
  "event ContestCreated(uint256 indexed contestId, address indexed host, string trackURI, uint256 prizeAmount)",
  "event RemixSubmitted(uint256 indexed submissionId, uint256 indexed contestId, address indexed submitter, string remixURI, address payoutWallet)",
  "event VoteCast(uint256 indexed contestId, uint256 indexed submissionId, address indexed voter, uint256 newVoteCount)",
  "event ContestEnded(uint256 indexed contestId, uint256 indexed winningSubmissionId, address indexed winner, uint256 prizeAmount)",
  "event PrizePaid(uint256 indexed contestId, uint256 indexed submissionId, address indexed recipient, uint256 amount)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
];

export default function MultiRemixBattle() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  
  // Form states
  const [trackURI, setTrackURI] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [remixURI, setRemixURI] = useState('');
  const [payoutWallet, setPayoutWallet] = useState('');
  const [selectedContestId, setSelectedContestId] = useState(null);

  const MULTI_REMIX_ADDRESS = process.env.NEXT_PUBLIC_MULTI_REMIX_ADDRESS;
  const PRIZE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS;
  const RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || '10143');

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus('❌ Please install MetaMask');
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (Number(network.chainId) !== CHAIN_ID) {
        setStatus(`❌ Please switch to Monad Testnet (Chain ID: ${CHAIN_ID})`);
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setUserAddress(accounts[0]);
      setStatus('✅ Wallet connected!');
      
      loadContests(web3Provider);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          setUserAddress('');
          setSigner(null);
          setStatus('❌ Wallet disconnected');
        } else {
          setUserAddress(accounts[0]);
          connectWallet();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('❌ Connection failed: ' + error.message);
    }
  };

  // Load Contests
  const loadContests = async (web3Provider = provider) => {
    if (!web3Provider || !MULTI_REMIX_ADDRESS) {
      console.log('Cannot load contests:', { provider: !!web3Provider, address: MULTI_REMIX_ADDRESS });
      return;
    }

    try {
      console.log('Loading contests from:', MULTI_REMIX_ADDRESS);
      const contract = new ethers.Contract(MULTI_REMIX_ADDRESS, MULTI_REMIX_ABI, web3Provider);
      const totalContests = await contract.contestCount();
      console.log('Total contests:', Number(totalContests));
      
      const loadedContests = [];
      for (let i = 1; i <= Number(totalContests); i++) {
        const contest = await contract.getContest(i);
        const submissionIds = await contract.getContestSubmissions(i);
        
        const submissions = [];
        console.log(`Contest ${i} has ${submissionIds.length} submissions`);
        for (let subId of submissionIds) {
          const sub = await contract.getSubmission(Number(subId));
          console.log(`Loaded submission #${subId}:`, sub.remixURI);
          submissions.push({
            id: Number(sub.id),
            contestId: Number(sub.contestId),
            submitter: sub.submitter,
            remixURI: sub.remixURI,
            payoutWallet: sub.payoutWallet,
            voteCount: Number(sub.voteCount),
            createdAt: Number(sub.createdAt)
          });
        }
        
        loadedContests.push({
          id: Number(contest.id),
          host: contest.host,
          trackURI: contest.trackURI,
          prizeAmount: ethers.formatEther(contest.prizeAmount),
          active: contest.active,
          createdAt: Number(contest.createdAt),
          endedAt: Number(contest.endedAt),
          winningSubmissionId: Number(contest.winningSubmissionId),
          submissions
        });
      }
      
      console.log('Loaded contests:', loadedContests);
      setContests(loadedContests);
    } catch (error) {
      console.error('Load error:', error);
      setStatus('❌ Error loading contests: ' + error.message);
    }
  };

  // Create Contest
  const handleCreateContest = async () => {
    if (!signer || !trackURI || !prizeAmount) {
      setStatus('❌ Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Creating contest...');

      const amount = ethers.parseEther(prizeAmount);
      const tokenContract = new ethers.Contract(PRIZE_TOKEN_ADDRESS, ERC20_ABI, signer);
      
      setStatus('⏳ Approving tokens...');
      const approveTx = await tokenContract.approve(MULTI_REMIX_ADDRESS, amount);
      await approveTx.wait();

      setStatus('⏳ Creating contest...');
      const contract = new ethers.Contract(MULTI_REMIX_ADDRESS, MULTI_REMIX_ABI, signer);
      const tx = await contract.createContest(trackURI, amount);
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setStatus(`✅ Contest created! TX: ${receipt.hash.slice(0, 10)}...`);
      setTrackURI('');
      setPrizeAmount('');
      
      setTimeout(() => loadContests(), 2000);
    } catch (error) {
      console.error('Create error:', error);
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Remix
  const handleSubmitRemix = async (contestId) => {
    if (!signer || !remixURI || !payoutWallet) {
      setStatus('❌ Please fill all fields');
      return;
    }

    if (!ethers.isAddress(payoutWallet)) {
      setStatus('❌ Invalid payout wallet address');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Submitting remix...');

      const contract = new ethers.Contract(MULTI_REMIX_ADDRESS, MULTI_REMIX_ABI, signer);
      const tx = await contract.submitRemix(contestId, remixURI, payoutWallet);
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setStatus(`✅ Remix submitted! TX: ${receipt.hash.slice(0, 10)}...`);
      setRemixURI('');
      setPayoutWallet('');
      setSelectedContestId(null);
      
      setTimeout(() => loadContests(), 2000);
    } catch (error) {
      console.error('Submit error:', error);
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Vote
  const handleVote = async (contestId, submissionId) => {
    if (!signer) {
      setStatus('❌ Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Preparing vote transaction...');

      // Reconnect if needed
      const web3Signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
      
      const contract = new ethers.Contract(MULTI_REMIX_ADDRESS, MULTI_REMIX_ABI, web3Signer);
      
      setStatus('⏳ Sending vote transaction...');
      const tx = await contract.vote(contestId, submissionId);
      
      setStatus('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setStatus(`✅ Vote cast! TX: ${receipt.hash.slice(0, 10)}...`);
      
      setTimeout(() => loadContests(), 2000);
    } catch (error) {
      console.error('Vote error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        setStatus('❌ Transaction rejected by user');
      } else if (error.message.includes('Already voted')) {
        setStatus('❌ You have already voted in this contest');
      } else if (error.message.includes('Block tracker destroyed')) {
        setStatus('❌ Connection lost. Please refresh and try again.');
      } else {
        setStatus('❌ Error: ' + (error.reason || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // End Contest
  const handleEndContest = async (contestId) => {
    if (!signer) return;

    if (!window.confirm('Are you sure you want to end this contest and distribute the prize?')) {
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Preparing to end contest...');

      // Reconnect if needed
      const web3Signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
      
      const contract = new ethers.Contract(MULTI_REMIX_ADDRESS, MULTI_REMIX_ABI, web3Signer);
      
      setStatus('⏳ Sending transaction to end contest...');
      const tx = await contract.endContestAndPay(contestId);
      
      setStatus('⏳ Waiting for confirmation and prize payout...');
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setStatus(`✅ Contest ended! Prize paid! TX: ${receipt.hash.slice(0, 10)}...`);
      
      setTimeout(() => loadContests(), 2000);
    } catch (error) {
      console.error('End contest error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        setStatus('❌ Transaction rejected by user');
      } else if (error.message.includes('Block tracker destroyed')) {
        setStatus('❌ Connection lost. Please refresh and try again.');
      } else if (error.message.includes('Not active')) {
        setStatus('❌ Contest is not active');
      } else if (error.message.includes('Only host')) {
        setStatus('❌ Only the contest host can end the contest');
      } else {
        setStatus('❌ Error: ' + (error.reason || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user has voted
  const checkUserVoted = async (contestId) => {
    if (!provider || !userAddress) return false;
    
    try {
      const contract = new ethers.Contract(MULTI_REMIX_ADDRESS, MULTI_REMIX_ABI, provider);
      return await contract.checkVoted(contestId, userAddress);
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (provider) {
      loadContests();
      const interval = setInterval(() => loadContests(), 10000);
      return () => clearInterval(interval);
    }
  }, [provider]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="/logo.png" alt="SONAD" className="h-16 w-16" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              SONAD Remix Battles
            </h1>
          </div>
          <p className="text-gray-300">Multiple submissions, community voting, winner takes prize!</p>
          {!MULTI_REMIX_ADDRESS && (
            <div className="mt-4 p-4 bg-red-900/50 rounded-lg">
              <p className="text-red-300">⚠️ NEXT_PUBLIC_MULTI_REMIX_ADDRESS not configured!</p>
              <p className="text-sm text-gray-400">Add to .env.local: NEXT_PUBLIC_MULTI_REMIX_ADDRESS=0xC0680334aA6b5B0aFc8253aE73900F3cC2e98B4D</p>
            </div>
          )}
        </div>

        {/* Wallet Connection */}
        {!userAddress ? (
          <div className="text-center mb-12">
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
              <button
                onClick={() => loadContests()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-bold"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status && (
          <div className={`mb-6 p-4 rounded-lg ${
            status.includes('❌') ? 'bg-red-900/50' :
            status.includes('✅') ? 'bg-green-900/50' :
            'bg-blue-900/50'
          }`}>
            <p>{status}</p>
            {txHash && (
              <a
                href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
              >
                View TX: {txHash.slice(0, 10)}...{txHash.slice(-8)} →
              </a>
            )}
          </div>
        )}

        {/* Create Contest Form */}
        {userAddress && (
          <div className="mb-12 p-6 bg-gray-800/50 rounded-xl border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-4">🎯 Create New Contest</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={trackURI}
                onChange={(e) => setTrackURI(e.target.value)}
                placeholder="Original Track URI (IPFS or URL)"
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              />
              <input
                type="text"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
                placeholder="Prize Amount (MON tokens)"
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              />
              <button
                onClick={handleCreateContest}
                disabled={loading || !trackURI || !prizeAmount}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-all"
              >
                {loading ? '⏳ Creating...' : '🎵 Create Contest'}
              </button>
            </div>
          </div>
        )}

        {/* Contests List */}
        <div className="space-y-8">
          {contests.map((contest) => (
            <div key={contest.id} className="bg-gray-800/50 rounded-xl border border-purple-500/30 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Contest #{contest.id}</h2>
                  <p className="text-gray-400 text-sm mb-1">Host: {contest.host.slice(0, 10)}...{contest.host.slice(-8)}</p>
                  <p className="text-gray-400 text-sm mb-1">Original: {contest.trackURI}</p>
                  <p className="text-purple-400 font-bold">Prize: {contest.prizeAmount} MON</p>
                </div>
                <div>
                  {contest.active ? (
                    <span className="px-4 py-2 bg-green-600 rounded-full text-sm font-bold">🟢 Active</span>
                  ) : (
                    <span className="px-4 py-2 bg-gray-600 rounded-full text-sm font-bold">⚫ Ended</span>
                  )}
                </div>
              </div>

              {/* Submit Remix Form */}
              {contest.active && userAddress && (
                <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                  {selectedContestId === contest.id ? (
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg">Submit Your Remix</h3>
                      <input
                        type="text"
                        value={remixURI}
                        onChange={(e) => setRemixURI(e.target.value)}
                        placeholder="Remix URI (IPFS or URL)"
                        className="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 outline-none"
                      />
                      <input
                        type="text"
                        value={payoutWallet}
                        onChange={(e) => setPayoutWallet(e.target.value)}
                        placeholder="Payout Wallet Address (0x...)"
                        className="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitRemix(contest.id)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-bold"
                        >
                          {loading ? '⏳ Submitting...' : '✅ Submit'}
                        </button>
                        <button
                          onClick={() => setSelectedContestId(null)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedContestId(contest.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold"
                    >
                      + Submit Remix
                    </button>
                  )}
                </div>
              )}

              {/* Submissions */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold">📝 Submissions ({contest.submissions.length})</h3>
                {contest.submissions.map((sub) => (
                  <div key={sub.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-lg mb-1">Remix #{sub.id}</p>
                        <p className="text-sm text-gray-400 mb-1">URI: {sub.remixURI}</p>
                        <p className="text-sm text-gray-400 mb-1">Submitter: {sub.submitter.slice(0, 10)}...{sub.submitter.slice(-8)}</p>
                        <p className="text-sm text-pink-400 font-bold">💰 Payout: {sub.payoutWallet.slice(0, 10)}...{sub.payoutWallet.slice(-8)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-400">{sub.voteCount}</p>
                        <p className="text-xs text-gray-500">votes</p>
                      </div>
                    </div>
                    
                    {contest.active && userAddress && (
                      <button
                        onClick={() => handleVote(contest.id, sub.id)}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-bold"
                      >
                        🗳️ Vote
                      </button>
                    )}
                    
                    {!contest.active && contest.winningSubmissionId === sub.id && (
                      <div className="mt-2 p-2 bg-yellow-600/30 rounded text-center font-bold">
                        🏆 WINNER! Prize paid to {sub.payoutWallet.slice(0, 10)}...{sub.payoutWallet.slice(-8)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* End Contest Button */}
              {contest.active && userAddress && contest.host.toLowerCase() === userAddress.toLowerCase() && (
                <div className="mt-6">
                  <button
                    onClick={() => handleEndContest(contest.id)}
                    disabled={loading || contest.submissions.length === 0}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold"
                  >
                    {loading ? '⏳ Processing...' : '🏁 End Contest & Pay Prize'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {contests.length === 0 && userAddress && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No contests yet. Create one to get started! 🎵</p>
          </div>
        )}
      </div>
    </div>
  );
}
