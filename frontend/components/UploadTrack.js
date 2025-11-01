'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
const BACKEND_ONLY = process.env.NEXT_PUBLIC_BACKEND_ONLY === 'true';

export default function UploadTrack({ onUpload, remixOf = null }) {
  const { signer, isConnected, account } = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp3' || file.type === 'audio/mp4')) {
      setAudioFile(file);
    } else {
      alert('Please select a valid audio file (MP3/WAV/MP4)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }

    setUploading(true);
    setStatus('Uploading to backend...');

    try {
      // Upload to backend storage (no IPFS, no blockchain)
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('title', title || 'Untitled');
      formData.append('description', description || '');
      formData.append('artist', account || 'Unknown');
      if (remixOf) {
        formData.append('parentId', remixOf);
      }

      const response = await fetch(`${BACKEND_URL}/api/tracks`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setStatus('✅ Track uploaded successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setAudioFile(null);
      
      // Notify parent
      if (onUpload) onUpload();
      
      // Reload page after short delay to show new track
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(`Error: ${error?.message || String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">
          {remixOf ? 'Upload Remix' : 'Upload Original Track'}
        </h2>
        {BACKEND_ONLY && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500 rounded-lg text-sm">
            ℹ️ Backend-only mode: Tracks are saved locally without blockchain/NFT minting
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Audio File (MP3/WAV/MP4)</label>
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp3,audio/mp4"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg transition disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Track'}
          </button>
          {status && (
            <p className={`text-sm ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

