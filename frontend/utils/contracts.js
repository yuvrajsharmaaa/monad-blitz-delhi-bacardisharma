import { ethers } from 'ethers';

// Contract ABIs (simplified - in production, import from artifacts)
const MUSIC_NFT_ABI = [
  'function mintOriginal(string calldata ipfsHash) external returns (uint256)',
  'function mintRemix(uint256 remixOf, string calldata ipfsHash) external returns (uint256)',
  'function getTrack(uint256 tokenId) external view returns (tuple(uint256 tokenId, string ipfsHash, uint256 timestamp, address creator, bool isRemix, uint256 remixOf))',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'event TrackMinted(uint256 indexed tokenId, address indexed creator, string ipfsHash, bool isRemix, uint256 remixOf)',
];

const VOTING_CONTRACT_ABI = [
  'function createCompetition(uint256 originalTrackId, uint256 duration, uint256 prizeAmount) external',
  'function registerRemix(uint256 originalTrackId, uint256 remixId) external',
  'function vote(uint256 originalTrackId, uint256 remixId) external',
  'function tallyVotes(uint256 originalTrackId) external view returns (uint256[] memory remixIds, uint256[] memory voteCounts)',
  'function declareWinner(uint256 originalTrackId) external',
  'function getCompetition(uint256 originalTrackId) external view returns (uint256[] memory remixIds, uint256 endTime, uint256 prizeAmount, bool winnerDeclared, uint256 winnerRemixId)',
  'event VoteCast(uint256 indexed originalTrackId, uint256 indexed remixId, address indexed voter, uint256 newVoteCount)',
  'event WinnerDeclared(uint256 indexed originalTrackId, uint256 indexed winnerRemixId, address winnerCreator, uint256 totalVotes)',
];

export function getMusicNFTContract(signer) {
  const address = process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS;
  if (!address) {
    // Return null when not configured so frontend can handle missing addresses
    return null;
  }
  return new ethers.Contract(address, MUSIC_NFT_ABI, signer);
}

export function getVotingContract(signer) {
  const address = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS;
  if (!address) {
    // Return null when not configured so frontend can handle missing addresses
    return null;
  }
  return new ethers.Contract(address, VOTING_CONTRACT_ABI, signer);
}

/**
 * Get MusicNFT contract for read-only operations
 */
export function getMusicNFTContractReadOnly(provider) {
  const address = process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS;
  if (!address) return null;
  return new ethers.Contract(address, MUSIC_NFT_ABI, provider);
}

/**
 * Get VotingContract for read-only operations
 */
export function getVotingContractReadOnly(provider) {
  const address = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS;
  if (!address) return null;
  return new ethers.Contract(address, VOTING_CONTRACT_ABI, provider);
}

