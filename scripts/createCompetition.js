const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Script to create a competition for an original track
 * Usage: npx hardhat run scripts/createCompetition.js --network monad
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS;
  
  if (!votingContractAddress) {
    throw new Error("Voting contract address not set in environment");
  }

  const VotingContract = await hre.ethers.getContractFactory("VotingContract");
  const votingContract = VotingContract.attach(votingContractAddress);

  // Parameters
  const originalTrackId = process.argv[2] || 1;
  const duration = parseInt(process.argv[3]) || 86400; // 1 day default
  const prizeAmount = process.argv[4] 
    ? ethers.parseEther(process.argv[4])
    : ethers.parseEther("1.0");

  console.log(`Creating competition for track ${originalTrackId}...`);
  console.log(`Duration: ${duration} seconds`);
  console.log(`Prize: ${ethers.formatEther(prizeAmount)} MON`);

  const tx = await votingContract.createCompetition(originalTrackId, duration, prizeAmount);
  await tx.wait();

  console.log("✅ Competition created!");
  console.log(`Transaction: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

