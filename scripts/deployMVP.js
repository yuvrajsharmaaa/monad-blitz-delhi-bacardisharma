const hre = require("hardhat");

/**
 * MVP Deployment Script - Fast Track Voting Setup
 * Deploys TrackVoting with immediate prize distribution capability
 * Optimized for 40-minute MVP deployment
 */
async function main() {
  console.log("\n🚀 MVP DEPLOYMENT - Single Track Voting with Prize Distribution");
  console.log("=" .repeat(70));

  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // MVP Configuration - Adjust these values
  const CONFIG = {
    HOST: deployer.address,                     // Host wallet (can be changed)
    TRACK_URI: "ipfs://QmMVPTrackHash",         // Your track URI
    PRIZE_TOKEN: process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS || "0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5", // MON token
    PRIZE_AMOUNT: hre.ethers.parseEther("50")   // 50 MON tokens prize
  };

  console.log("📋 MVP Configuration:");
  console.log("   Host:", CONFIG.HOST);
  console.log("   Track URI:", CONFIG.TRACK_URI);
  console.log("   Prize Token:", CONFIG.PRIZE_TOKEN);
  console.log("   Prize Amount:", hre.ethers.formatEther(CONFIG.PRIZE_AMOUNT), "MON\n");

  // Step 1: Deploy TrackVoting
  console.log("⏳ Deploying TrackVoting contract...");
  const TrackVoting = await hre.ethers.getContractFactory("TrackVoting");
  const trackVoting = await TrackVoting.deploy(
    CONFIG.HOST,
    CONFIG.TRACK_URI,
    CONFIG.PRIZE_TOKEN,
    CONFIG.PRIZE_AMOUNT
  );

  await trackVoting.waitForDeployment();
  const votingAddress = await trackVoting.getAddress();
  
  console.log("✅ TrackVoting deployed to:", votingAddress);

  // Step 2: Get Prize Token for approval
  const prizeToken = await hre.ethers.getContractAt("IERC20", CONFIG.PRIZE_TOKEN);
  const hostBalance = await prizeToken.balanceOf(CONFIG.HOST);
  
  console.log("\n💎 Prize Token Status:");
  console.log("   Host Balance:", hre.ethers.formatEther(hostBalance), "MON");
  console.log("   Required:", hre.ethers.formatEther(CONFIG.PRIZE_AMOUNT), "MON");

  if (hostBalance < CONFIG.PRIZE_AMOUNT) {
    console.log("\n⚠️  WARNING: Insufficient balance!");
    console.log("   Get MON tokens from faucet first!");
  }

  console.log("\n" + "=".repeat(70));
  console.log("📦 DEPLOYMENT SUMMARY");
  console.log("=".repeat(70));
  console.log("TrackVoting:   ", votingAddress);
  console.log("Prize Token:   ", CONFIG.PRIZE_TOKEN);
  console.log("Host:          ", CONFIG.HOST);
  console.log("Prize:         ", hre.ethers.formatEther(CONFIG.PRIZE_AMOUNT), "MON");
  console.log("=".repeat(70));

  console.log("\n📝 FRONTEND CONFIGURATION");
  console.log("=".repeat(70));
  console.log("Add to frontend/.env.local:\n");
  console.log(`NEXT_PUBLIC_TRACK_VOTING_ADDRESS=${votingAddress}`);
  console.log(`NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=${CONFIG.PRIZE_TOKEN}`);
  console.log(`NEXT_PUBLIC_TRACK_HOST=${CONFIG.HOST}`);
  console.log(`NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz`);
  console.log(`NEXT_PUBLIC_MONAD_CHAIN_ID=10143`);

  console.log("\n" + "=".repeat(70));
  console.log("⚡ QUICK START STEPS");
  console.log("=".repeat(70));
  console.log("1. Update frontend/.env.local with address above");
  console.log("2. Get MON tokens:");
  console.log("   → Navigate to 'Remix Battles' tab");
  console.log("   → Click 'Claim 100 PRIZE'");
  console.log("3. Approve contract to spend tokens:");
  console.log("   → Will be prompted automatically in UI");
  console.log("   → Or manually: await prizeToken.approve(votingAddress, prizeAmount)");
  console.log("4. Start frontend:");
  console.log("   → cd frontend && npm run dev");
  console.log("5. Navigate to 'Track Voting' tab");
  console.log("6. Test MVP flow:");
  console.log("   → Submit remixes");
  console.log("   → Vote for remixes");
  console.log("   → End voting (host only)");
  console.log("   → Winner gets prize automatically! 🎉");

  console.log("\n" + "=".repeat(70));
  console.log("🧪 TESTING");
  console.log("=".repeat(70));
  console.log("npx hardhat test test/TrackVoting.test.js");
  console.log("Expected: 33 passing tests ✅");

  console.log("\n✅ MVP DEPLOYMENT COMPLETE!");
  console.log("⏱️  Ready for 40-minute demo!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
