const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  // Configuration
  const MULTI_REMIX_ADDRESS = process.env.NEXT_PUBLIC_MULTI_REMIX_ADDRESS;
  const PRIZE_TOKEN_ADDRESS = process.env.PRIZE_TOKEN_ADDRESS || "0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5";
  
  if (!MULTI_REMIX_ADDRESS) {
    console.error("❌ Please set NEXT_PUBLIC_MULTI_REMIX_ADDRESS in your .env");
    console.log("Deploy first: npx hardhat run scripts/deployMultiRemix.js --network monad");
    process.exit(1);
  }

  console.log("🎵 Setting up Contest #1 with Test Data\n");
  
  const [host] = await ethers.getSigners();
  
  console.log("📋 Wallets:");
  console.log(`Host: ${host.address}\n`);
  console.log("Note: Using host wallet for all votes (simplified test)");
  
  // Get contracts
  const MultiRemixContest = await ethers.getContractAt("MultiRemixContest", MULTI_REMIX_ADDRESS);
  const PrizeToken = await ethers.getContractAt("IERC20", PRIZE_TOKEN_ADDRESS);
  
  // Step 1: Create Contest
  console.log("1️⃣ Creating Contest #1...");
  const prizeAmount = ethers.parseEther("1"); // 1 MON
  
  // Approve tokens
  console.log("   Approving tokens...");
  const approveTx = await PrizeToken.connect(host).approve(MULTI_REMIX_ADDRESS, prizeAmount);
  await approveTx.wait();
  
  // Create contest
  const createTx = await MultiRemixContest.connect(host).createContest(
    "ipfs://original-track-uri",
    prizeAmount
  );
  const receipt = await createTx.wait();
  console.log("   ✅ Contest created!");
  
  // Step 2: Submit First Remix (0x14987b6b98a4a2564d0b16c64c1ed9fc9e974179)
  console.log("\n2️⃣ Submitting Remix #1 (payout: 0x14987b6b98a4a2564d0b16c64c1ed9fc9e974179)...");
  const submit1Tx = await MultiRemixContest.connect(host).submitRemix(
    1, // contestId
    "ipfs://remix-1-uri",
    "0x14987b6b98a4a2564d0b16c64c1ed9fc9e974179"
  );
  await submit1Tx.wait();
  console.log("   ✅ Remix #1 submitted!");
  
  // Step 3: Submit Second Remix (0x9b0788f6ee5984b308ed4f3ec131569fa28ed54b)
  console.log("\n3️⃣ Submitting Remix #2 (payout: 0x9b0788f6ee5984b308ed4f3ec131569fa28ed54b)...");
  const submit2Tx = await MultiRemixContest.connect(host).submitRemix(
    1, // contestId
    "ipfs://remix-2-uri",
    "0x9b0788f6ee5984b308ed4f3ec131569fa28ed54b"
  );
  await submit2Tx.wait();
  console.log("   ✅ Remix #2 submitted!");
  
  // Note: In test, we can't actually vote multiple times from same wallet
  // The votes will need to be cast manually from the UI with different wallets
  console.log("\n4️⃣ Ready for voting!");
  console.log("   Note: You'll need to vote from different wallets in the UI");
  console.log("   Target: 3 votes for Remix #1, 1 vote for Remix #2");
  
  // Step 6: Display Results
  console.log("\n" + "=".repeat(60));
  console.log("📊 CONTEST #1 STATUS");
  console.log("=".repeat(60));
  
  const submission1 = await MultiRemixContest.getSubmission(1);
  const submission2 = await MultiRemixContest.getSubmission(2);
  
  console.log("\n🎵 Remix #1:");
  console.log(`   URI: ${submission1.remixURI}`);
  console.log(`   Payout Wallet: ${submission1.payoutWallet}`);
  console.log(`   Votes: ${submission1.voteCount} 🏆`);
  
  console.log("\n🎵 Remix #2:");
  console.log(`   URI: ${submission2.remixURI}`);
  console.log(`   Payout Wallet: ${submission2.payoutWallet}`);
  console.log(`   Votes: ${submission2.voteCount}`);
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Setup Complete!");
  console.log("=".repeat(60));
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Open frontend at http://localhost:3001/battles");
  console.log("2. Connect wallet as host:", host.address);
  console.log("3. Click 'End Contest & Pay Prize'");
  console.log("4. Winner (Remix #1) will receive 1 MON at:");
  console.log("   0x14987b6b98a4a2564d0b16c64c1ed9fc9e974179");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
