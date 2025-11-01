import { ethers } from 'ethers';

// Contract ABIs
export const REMIX_BATTLE_ABI = [
  'function battleCount() external view returns (uint256)',
  'function submissionCount() external view returns (uint256)',
  'function createBattle(string memory trackURI, uint256 prizeAmount) external returns (uint256)',
  'function submitRemix(uint256 battleId, string memory remixURI) external returns (uint256)',
  'function voteRemix(uint256 battleId, uint256 submissionId) external',
  'function endBattle(uint256 battleId) external',
  'function getBattle(uint256 battleId) external view returns (tuple(address host, string trackURI, uint256 prizeAmount, bool active, address winnerAddress, uint256 createdAt, uint256 endedAt, uint256 submissionCount))',
  'function getBattleSubmissions(uint256 battleId) external view returns (uint256[])',
  'function getSubmission(uint256 submissionId) external view returns (tuple(uint256 submissionId, uint256 battleId, address remixer, string remixURI, uint256 votes, uint256 createdAt))',
  'function hasVotedInBattle(uint256 battleId, address voter) external view returns (bool)',
  'function getLeaderboard(uint256 battleId) external view returns (uint256[] submissionIds, uint256[] votes)',
  'event BattleCreated(uint256 indexed battleId, address indexed host, string trackURI, uint256 prizeAmount)',
  'event RemixSubmitted(uint256 indexed battleId, uint256 indexed submissionId, address indexed remixer, string remixURI)',
  'event VoteCast(uint256 indexed battleId, uint256 indexed submissionId, address indexed voter, uint256 newVoteCount)',
  'event BattleEnded(uint256 indexed battleId, uint256 indexed winningSubmissionId, address indexed winner, uint256 prizeAmount)',
  'event PrizeDistributed(uint256 indexed battleId, address indexed winner, uint256 amount)',
];

export const PRIZE_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function faucet() external',
  'function mint(address to, uint256 amount) external',
];

/**
 * Get RemixBattle contract instance (read-only)
 */
export function getRemixBattleContractReadOnly(provider) {
  const address = process.env.NEXT_PUBLIC_REMIX_BATTLE_ADDRESS;
  if (!address) return null;
  return new ethers.Contract(address, REMIX_BATTLE_ABI, provider);
}

/**
 * Get RemixBattle contract instance (read-write)
 */
export function getRemixBattleContract(signer) {
  const address = process.env.NEXT_PUBLIC_REMIX_BATTLE_ADDRESS;
  if (!address) return null;
  return new ethers.Contract(address, REMIX_BATTLE_ABI, signer);
}

/**
 * Get PrizeToken contract instance (read-only)
 */
export function getPrizeTokenContractReadOnly(provider) {
  const address = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS;
  if (!address) return null;
  return new ethers.Contract(address, PRIZE_TOKEN_ABI, provider);
}

/**
 * Get PrizeToken contract instance (read-write)
 */
export function getPrizeTokenContract(signer) {
  const address = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS;
  if (!address) return null;
  return new ethers.Contract(address, PRIZE_TOKEN_ABI, signer);
}

/**
 * Create a new remix battle
 */
export async function createBattle(signer, trackURI, prizeAmount) {
  const battleContract = getRemixBattleContract(signer);
  const tokenContract = getPrizeTokenContract(signer);
  
  if (!battleContract || !tokenContract) {
    throw new Error('Contracts not configured');
  }

  // First approve tokens
  const approveTx = await tokenContract.approve(
    process.env.NEXT_PUBLIC_REMIX_BATTLE_ADDRESS,
    prizeAmount
  );
  await approveTx.wait();

  // Then create battle
  const tx = await battleContract.createBattle(trackURI, prizeAmount);
  const receipt = await tx.wait();
  
  // Extract battleId from event
  const event = receipt.logs.find(log => {
    try {
      const parsed = battleContract.interface.parseLog(log);
      return parsed?.name === 'BattleCreated';
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = battleContract.interface.parseLog(event);
    return parsed.args.battleId;
  }
  
  return null;
}

/**
 * Submit a remix to a battle
 */
export async function submitRemix(signer, battleId, remixURI) {
  const contract = getRemixBattleContract(signer);
  if (!contract) throw new Error('Contract not configured');
  
  const tx = await contract.submitRemix(battleId, remixURI);
  const receipt = await tx.wait();
  
  // Extract submissionId from event
  const event = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === 'RemixSubmitted';
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = contract.interface.parseLog(event);
    return parsed.args.submissionId;
  }
  
  return null;
}

/**
 * Vote for a remix
 */
export async function voteForRemix(signer, battleId, submissionId) {
  const contract = getRemixBattleContract(signer);
  if (!contract) throw new Error('Contract not configured');
  
  const tx = await contract.voteRemix(battleId, submissionId);
  await tx.wait();
}

/**
 * End a battle and distribute prizes
 */
export async function endBattle(signer, battleId) {
  const contract = getRemixBattleContract(signer);
  if (!contract) throw new Error('Contract not configured');
  
  const tx = await contract.endBattle(battleId);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Get battle details
 */
export async function getBattleDetails(provider, battleId) {
  const contract = getRemixBattleContractReadOnly(provider);
  if (!contract) throw new Error('Contract not configured');
  
  const battle = await contract.getBattle(battleId);
  return {
    host: battle.host,
    trackURI: battle.trackURI,
    prizeAmount: battle.prizeAmount,
    active: battle.active,
    winnerAddress: battle.winnerAddress,
    createdAt: battle.createdAt,
    endedAt: battle.endedAt,
    submissionCount: battle.submissionCount,
  };
}

/**
 * Get all submissions for a battle
 */
export async function getBattleSubmissions(provider, battleId) {
  const contract = getRemixBattleContractReadOnly(provider);
  if (!contract) throw new Error('Contract not configured');
  
  const submissionIds = await contract.getBattleSubmissions(battleId);
  const submissions = await Promise.all(
    submissionIds.map(async (id) => {
      const sub = await contract.getSubmission(id);
      return {
        submissionId: sub.submissionId,
        battleId: sub.battleId,
        remixer: sub.remixer,
        remixURI: sub.remixURI,
        votes: sub.votes,
        createdAt: sub.createdAt,
      };
    })
  );
  
  return submissions;
}

/**
 * Get leaderboard for a battle
 */
export async function getBattleLeaderboard(provider, battleId) {
  const contract = getRemixBattleContractReadOnly(provider);
  if (!contract) throw new Error('Contract not configured');
  
  const [submissionIds, votes] = await contract.getLeaderboard(battleId);
  return submissionIds.map((id, index) => ({
    submissionId: id,
    votes: votes[index],
  }));
}

/**
 * Check if address has voted
 */
export async function hasVoted(provider, battleId, address) {
  const contract = getRemixBattleContractReadOnly(provider);
  if (!contract) throw new Error('Contract not configured');
  
  return await contract.hasVotedInBattle(battleId, address);
}

/**
 * Get prize token balance
 */
export async function getPrizeTokenBalance(provider, address) {
  const contract = getPrizeTokenContractReadOnly(provider);
  if (!contract) return ethers.parseEther('0');
  
  return await contract.balanceOf(address);
}

/**
 * Claim tokens from faucet
 */
export async function claimFaucetTokens(signer) {
  const contract = getPrizeTokenContract(signer);
  if (!contract) throw new Error('Token contract not configured');
  
  const tx = await contract.faucet();
  await tx.wait();
}
