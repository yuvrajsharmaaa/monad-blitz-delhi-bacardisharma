const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const MULTI_REMIX_ADDRESS = process.env.NEXT_PUBLIC_MULTI_REMIX_ADDRESS;
  
  if (!MULTI_REMIX_ADDRESS) {
    console.error("❌ Please set NEXT_PUBLIC_MULTI_REMIX_ADDRESS in your .env");
    process.exit(1);
  }

  console.log("🗳️ Casting Test Votes\n");
  
  const [voter] = await ethers.getSigners();
  console.log(`Voter: ${voter.address}\n`);
  
  const MultiRemixContest = await ethers.getContractAt("MultiRemixContest", MULTI_REMIX_ADDRESS);
  
  // Check if already voted
  const hasVoted = await MultiRemixContest.checkVoted(1, voter.address);
  if (hasVoted) {
    console.log("❌ This wallet has already voted in Contest #1");
    console.log("Please use a different wallet from the UI to vote");
    process.exit(0);
  }
  
  // Vote for Remix #1 (the one with 0x1498...9179)
  console.log("Voting for Remix #1...");
  const voteTx = await MultiRemixContest.vote(1, 1);
  await voteTx.wait();
  console.log("✅ Vote cast!");
  
  // Get updated vote count
  const submission1 = await MultiRemixContest.getSubmission(1);
  console.log(`\n🎵 Remix #1 now has ${submission1.voteCount} vote(s)`);
  console.log(`   Payout wallet: ${submission1.payoutWallet}`);
  
  console.log("\n💡 To cast more votes:");
  console.log("   1. Use different wallets from the UI");
  console.log("   2. Vote for Remix #1 two more times (total 3)");
  console.log("   3. Vote for Remix #2 once");
  console.log("   4. Then end the contest!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
