'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import {
  createBattle,
  getBattleDetails,
  getBattleSubmissions,
  getBattleLeaderboard,
  submitRemix,
  voteForRemix,
  endBattle,
  getPrizeTokenBalance,
  claimFaucetTokens,
  getRemixBattleContractReadOnly,
} from '../utils/remixBattle';
import BattleCard from './BattleCard';
import CreateBattleModal from './CreateBattleModal';

export default function RemixBattlePage() {
  const { signer, provider, account, isConnected } = useWallet();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prizeBalance, setPrizeBalance] = useState('0');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (provider) {
      loadBattles();
    }
  }, [provider]);

  useEffect(() => {
    if (provider && account) {
      loadPrizeBalance();
    }
  }, [provider, account]);

  async function loadBattles() {
    try {
      setLoading(true);
      const contract = getRemixBattleContractReadOnly(provider);
      if (!contract) {
        setStatus('Remix Battle contract not configured');
        return;
      }

      const battleCount = await contract.battleCount();
      const battlesData = [];

      for (let i = 1; i <= battleCount; i++) {
        const battle = await getBattleDetails(provider, i);
        const submissions = await getBattleSubmissions(provider, i);
        battlesData.push({
          id: i,
          ...battle,
          submissions,
        });
      }

      setBattles(battlesData.reverse()); // Show newest first
    } catch (error) {
      console.error('Error loading battles:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadPrizeBalance() {
    try {
      const balance = await getPrizeTokenBalance(provider, account);
      setPrizeBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error loading prize balance:', error);
    }
  }

  async function handleClaimTokens() {
    if (!signer) return;
    try {
      setStatus('Claiming tokens from faucet...');
      await claimFaucetTokens(signer);
      setStatus('✅ Claimed 100 PRIZE tokens!');
      await loadPrizeBalance();
    } catch (error) {
      console.error('Faucet error:', error);
      setStatus(`Error: ${error.message}`);
    }
  }

  async function handleCreateBattle(trackURI, prizeAmount) {
    if (!signer) return;
    try {
      setStatus('Creating battle...');
      const battleId = await createBattle(signer, trackURI, prizeAmount);
      setStatus(`✅ Battle #${battleId} created!`);
      setShowCreateModal(false);
      await loadBattles();
      await loadPrizeBalance();
    } catch (error) {
      console.error('Create battle error:', error);
      setStatus(`Error: ${error.message}`);
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Remix Battle Arena</h2>
        <p className="text-gray-400 mb-6">Connect your wallet to participate in remix battles</p>
        <div className="text-sm text-gray-500">
          <p>• Create battles with prize pools</p>
          <p>• Submit your remixes</p>
          <p>• Vote for winners</p>
          <p>• Earn prize tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">🎵 Remix Battle Arena</h1>
          <p className="text-gray-400">On-chain remix competitions on Monad</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-4 py-2 bg-purple-900/30 border border-purple-500 rounded-lg">
            <div className="text-xs text-purple-300">Your Balance</div>
            <div className="text-lg font-bold text-purple-100">{prizeBalance} PRIZE</div>
          </div>
          <button
            onClick={handleClaimTokens}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition"
          >
            🎁 Claim 100 PRIZE
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-primary hover:bg-primary/90 rounded transition"
          >
            Create Battle
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg ${
          status.includes('Error') || status.includes('❌')
            ? 'bg-red-900/30 border border-red-500 text-red-200'
            : status.includes('✅')
            ? 'bg-green-900/30 border border-green-500 text-green-200'
            : 'bg-blue-900/30 border border-blue-500 text-blue-200'
        }`}>
          {status}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading battles...</p>
        </div>
      )}

      {/* No battles */}
      {!loading && battles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl mb-2">No battles yet</p>
          <p>Create the first remix battle!</p>
        </div>
      )}

      {/* Battles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {battles.map((battle) => (
          <BattleCard
            key={battle.id}
            battle={battle}
            onRefresh={loadBattles}
            currentUser={account}
          />
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateBattleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateBattle}
          prizeBalance={prizeBalance}
        />
      )}
    </div>
  );
}
