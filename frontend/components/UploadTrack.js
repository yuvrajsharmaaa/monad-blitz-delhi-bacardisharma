'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getMusicNFTContract } from '../utils/contracts';
import { uploadToIPFS, uploadMetadata } from '../utils/ipfs';

export default function UploadTrack({ onUpload, remixOf = null }) {
  const { signer, isConnected } = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp3')) {
      setAudioFile(file);
    } else {
      alert('Please select a valid audio file (MP3/WAV)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected || !signer) {
      alert('Please connect your wallet');
      return;
    }
    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }

    setUploading(true);
    setStatus('Uploading audio to IPFS...');

    try {
      // Upload audio file to backend
      const audioFileId = await uploadToIPFS(audioFile);
      setStatus('Audio uploaded! Creating metadata...');

      // Create metadata
      const metadata = {
        title,
        description,
        creator: 'User', // Could fetch from wallet
        creatorAddress: (await signer.getAddress()).toLowerCase(),
        audioHash: audioFileId, // Use fileId instead of IPFS hash
        metadataId: '',
        timestamp: Date.now(),
        type: remixOf ? 'remix' : 'original',
        remixOf: remixOf || null,
      };

      // Upload metadata to backend
      const metadataId = await uploadMetadata(metadata);
      metadata.metadataId = metadataId;
      setStatus('Minting NFT...');

      // Mint NFT
      const musicNFT = getMusicNFTContract(signer);
      if (!musicNFT) {
        throw new Error('Music NFT contract address not configured. Add NEXT_PUBLIC_MUSIC_NFT_ADDRESS to .env.local');
      }

      let tx;
      if (remixOf) {
        tx = await musicNFT.mintRemix(remixOf, metadataId);
      } else {
        tx = await musicNFT.mintOriginal(metadataId);
      }

      setStatus('Waiting for transaction confirmation...');
      await tx.wait();
      
      setStatus('✅ Track uploaded successfully!');
      setTitle('');
      setDescription('');
      setAudioFile(null);
      
      if (onUpload) onUpload();
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
            <label className="block text-sm font-medium mb-2">Audio File (MP3/WAV)</label>
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp3"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !isConnected}
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

