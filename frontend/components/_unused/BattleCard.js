'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { submitRemix, voteForRemix, endBattle, hasVoted } from '../utils/remixBattle';

export default function BattleCard({ battle, onRefresh, currentUser }) {
  const { signer, provider } = useWallet();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [remixURI, setRemixURI] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);

  const isHost = currentUser?.toLowerCase() === battle.host.toLowerCase();
  const prizeInEther = ethers.formatEther(battle.prizeAmount);

  React.useEffect(() => {
    checkVoteStatus();
  }, [currentUser, battle.id]);

  async function checkVoteStatus() {
    if (!provider || !currentUser) return;
    try {
      const voted = await hasVoted(provider, battle.id, currentUser);
      setUserHasVoted(voted);
    } catch (error) {
      console.error('Check vote error:', error);
    }
  }

  async function handleSubmitRemix() {
    if (!signer || !remixURI) return;
    setLoading(true);
    try {
      setStatus('Submitting remix...');
      await submitRemix(signer, battle.id, remixURI);
      setStatus('✅ Remix submitted!');
      setRemixURI('');
      setShowSubmit(false);
      onRefresh();
    } catch (error) {
      console.error('Submit error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(submissionId) {
    if (!signer) return;
    setLoading(true);
    try {
      setStatus('Casting vote...');
      await voteForRemix(signer, battle.id, submissionId);
      setStatus('✅ Vote cast!');
      setUserHasVoted(true);
      onRefresh();
    } catch (error) {
      console.error('Vote error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleEndBattle() {
    if (!signer) return;
    setLoading(true);
    try {
      setStatus('Ending battle and distributing prizes...');
      await endBattle(signer, battle.id);
      setStatus('✅ Battle ended! Winner declared and prize distributed!');
      onRefresh();
    } catch (error) {
      console.error('End battle error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Sort submissions by votes
  const sortedSubmissions = [...battle.submissions].sort((a, b) => 
    Number(b.votes) - Number(a.votes)
  );

  return (
    <div className={`bg-gray-800 rounded-lg p-5 border-2 ${
      !battle.active ? 'border-yellow-500' : 'border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold">Battle #{battle.id}</h3>
            {!battle.active && (
              <span className="px-2 py-1 bg-yellow-600 rounded-full text-xs">
                ENDED
              </span>
            )}
            {battle.active && (
              <span className="px-2 py-1 bg-green-600 rounded-full text-xs">
                ACTIVE
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            Host: {battle.host.slice(0, 6)}...{battle.host.slice(-4)}
            {isHost && <span className="ml-2 text-purple-400">(You)</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{prizeInEther}</div>
          <div className="text-xs text-gray-400">PRIZE</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-900 rounded">
        <div>
          <div className="text-xs text-gray-400">Submissions</div>
          <div className="text-lg font-bold">{battle.submissions.length}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Total Votes</div>
          <div className="text-lg font-bold">
            {battle.submissions.reduce((sum, s) => sum + Number(s.votes), 0)}
          </div>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mb-3 p-2 rounded text-xs ${
          status.includes('Error') ? 'bg-red-900/40 text-red-200' :
          status.includes('✅') ? 'bg-green-900/40 text-green-200' :
          'bg-blue-900/40 text-blue-200'
        }`}>
          {status}
        </div>
      )}

      {/* Winner */}
      {!battle.active && battle.winnerAddress !== ethers.ZeroAddress && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500 rounded">
          <div className="text-xs text-yellow-300 mb-1">🏆 Winner</div>
          <div className="font-bold text-yellow-100">
            {battle.winnerAddress.slice(0, 6)}...{battle.winnerAddress.slice(-4)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        {battle.active && !isHost && (
          <button
            onClick={() => setShowSubmit(!showSubmit)}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition disabled:opacity-50"
          >
            Submit Remix
          </button>
        )}
        {battle.active && isHost && battle.submissions.length > 0 && (
          <button
            onClick={handleEndBattle}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition disabled:opacity-50"
          >
            End Battle
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
        >
          {expanded ? 'Hide' : 'Show'} Submissions
        </button>
      </div>

      {/* Submit Form */}
      {showSubmit && battle.active && (
        <div className="mb-4 p-3 bg-gray-900 rounded">
          <input
            type="text"
            value={remixURI}
            onChange={(e) => setRemixURI(e.target.value)}
            placeholder="Remix URI (ipfs:// or http://)"
            className="w-full px-3 py-2 bg-gray-800 rounded mb-2 text-sm"
          />
          <button
            onClick={handleSubmitRemix}
            disabled={loading || !remixURI}
            className="w-full px-3 py-2 bg-primary hover:bg-primary/90 rounded text-sm transition disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}

      {/* Submissions */}
      {expanded && (
        <div className="space-y-2">
          <div className="text-sm font-bold text-gray-300 mb-2">
            Submissions ({sortedSubmissions.length})
          </div>
          {sortedSubmissions.length === 0 && (
            <p className="text-sm text-gray-500 py-4">No submissions yet</p>
          )}
          {sortedSubmissions.map((sub, idx) => (
            <div
              key={sub.submissionId.toString()}
              className="p-3 bg-gray-900 rounded border border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-yellow-400">🥇</span>}
                    {idx === 1 && <span className="text-gray-300">🥈</span>}
                    {idx === 2 && <span className="text-orange-400">🥉</span>}
                    <span className="text-xs text-gray-400">
                      #{sub.submissionId.toString()} by{' '}
                      {sub.remixer.slice(0, 6)}...{sub.remixer.slice(-4)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {sub.remixURI.slice(0, 40)}...
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {sub.votes.toString()}
                  </div>
                  <div className="text-xs text-gray-400">votes</div>
                </div>
              </div>
              {battle.active && !userHasVoted && (
                <button
                  onClick={() => handleVote(sub.submissionId)}
                  disabled={loading}
                  className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition disabled:opacity-50"
                >
                  Vote
                </button>
              )}
              {userHasVoted && (
                <div className="text-xs text-center text-gray-500 py-1">
                  Already voted
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
