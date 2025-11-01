'use client';

import React, { useState } from 'react';

export default function RemixUploadModal({ parentId, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file');

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('parentId', parentId);

      const res = await fetch('http://localhost:3002/api/tracks', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      const data = await res.json();
      if (onSuccess) onSuccess(data.track);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Upload Remix</h3>
          <button onClick={onClose} className="text-gray-400">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded" />
          </div>
          <div>
            <label className="block text-sm">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded" rows={3} />
          </div>
          <div>
            <label className="block text-sm">MP4 / Audio File</label>
            <input type="file" accept="video/mp4,audio/*" onChange={handleFile} className="w-full" />
          </div>
          {error && <div className="text-red-400">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancel</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary rounded">{uploading ? 'Uploading...' : 'Upload'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
