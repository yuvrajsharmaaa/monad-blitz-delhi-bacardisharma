'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';

export default function CreateBattleModal({ onClose, onCreate, prizeBalance }) {
  const [trackURI, setTrackURI] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('10');
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!trackURI || !prizeAmount) {
      alert('Please fill in all fields');
      return;
    }

    const prizeWei = ethers.parseEther(prizeAmount);
    setUploading(true);
    
    try {
      await onCreate(trackURI, prizeWei);
    } catch (error) {
      console.error('Create error:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Remix Battle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Track URI (IPFS or URL)
            </label>
            <input
              type="text"
              value={trackURI}
              onChange={(e) => setTrackURI(e.target.value)}
              placeholder="ipfs://... or http://..."
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              IPFS hash or HTTP URL of your main track
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Prize Amount (PRIZE tokens)
            </label>
            <input
              type="number"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
              min="1"
              step="1"
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Your balance: {prizeBalance} PRIZE
            </p>
          </div>

          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 text-sm">
            <p className="text-blue-200">
              ℹ️ Prize tokens will be locked in the contract until the battle ends.
              The winner receives the full amount automatically.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? 'Creating...' : 'Create Battle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
