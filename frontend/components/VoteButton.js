'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getVotingContract } from '../utils/contracts';

export default function VoteButton({ trackId, remixId, disabled }) {
  const { signer, account, isConnected } = useWallet();
  const [voting, setVoting] = useState(false);
  const [status, setStatus] = useState('');

  const handleVote = async () => {
    if (!isConnected || !signer) {
      alert('Please connect your wallet');
      return;
    }

    setVoting(true);
    setStatus('Submitting vote...');

    try {
      const votingContract = getVotingContract(signer);
      const tx = await votingContract.vote(trackId, remixId);
      setStatus('Waiting for confirmation...');
      await tx.wait();
      setStatus('✅ Vote cast successfully!');
    } catch (error) {
      console.error('Vote error:', error);
      if (error.message.includes('Already voted')) {
        setStatus('❌ You have already voted');
      } else {
        setStatus(`Error: ${error.message}`);
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleVote}
        disabled={disabled || voting || !isConnected}
        className="px-4 py-2 bg-secondary hover:bg-secondary/90 rounded-lg transition disabled:opacity-50"
      >
        {voting ? 'Voting...' : 'Vote'}
      </button>
      {status && (
        <p className={`text-xs ${status.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
          {status}
        </p>
      )}
    </div>
  );
}

