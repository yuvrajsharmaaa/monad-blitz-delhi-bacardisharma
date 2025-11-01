/**
 * Frontend storage utilities
 * Handles uploading to local backend server (replaces IPFS)
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

/**
 * Upload audio file to backend
 * @param {File} file - Audio file to upload
 * @returns {Promise<string>} - File ID
 */
export async function uploadToIPFS(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.fileId; // Return fileId instead of IPFS hash
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Upload metadata to backend
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} - Metadata ID
 */
export async function uploadMetadata(metadata) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Metadata upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.metadataId; // Return metadataId
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
}

/**
 * Get file URL from backend
 * @param {string} fileId - File ID
 * @returns {string} - Full URL to file
 */
export function getIPFSURL(fileId) {
  return `${BACKEND_URL}/api/files/${fileId}`;
}

/**
 * Fetch metadata from backend
 * @param {string} metadataId - Metadata ID
 * @returns {Promise<Object>} - Metadata object
 */
export async function fetchFromIPFS(metadataId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/metadata/${metadataId}`);
    
    if (!response.ok) {
      throw new Error(`Metadata fetch failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Metadata fetch error:', error);
    throw error;
  }
}

