/**
 * Frontend IPFS utilities
 * Handles uploading to IPFS via HTTP API
 */

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const IPFS_API = 'https://api.ipfs.io/api/v0';

export async function uploadToIPFS(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${IPFS_API}/add`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data.Hash;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

export async function uploadMetadata(metadata) {
  try {
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json');
    return await uploadToIPFS(file);
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
}

export function getIPFSURL(hash) {
  return `${IPFS_GATEWAY}${hash}`;
}

export async function fetchFromIPFS(hash) {
  try {
    const url = getIPFSURL(hash);
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw error;
  }
}

