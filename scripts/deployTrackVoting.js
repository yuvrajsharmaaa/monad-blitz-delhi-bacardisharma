const hre = require("hardhat");

/**
 * Deploy TrackVoting contract to Monad testnet
 * This script deploys a single track voting contract with prize distribution
 */
async function main() {
  console.log("Deploying TrackVoting to Monad testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const HOST_ADDRESS = deployer.address; // Track host (can be changed)
  const TRACK_URI = "ipfs://QmExampleTrackHash123"; // Replace with actual track URI
  const PRIZE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS || "0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5"; // MON token on Monad
  const PRIZE_AMOUNT = hre.ethers.parseEther("100"); // 100 MON tokens

  console.log("\nConfiguration:");
  console.log("Host:", HOST_ADDRESS);
  console.log("Track URI:", TRACK_URI);
  console.log("Prize Token:", PRIZE_TOKEN_ADDRESS);
  console.log("Prize Amount:", hre.ethers.formatEther(PRIZE_AMOUNT), "MON\n");

  // Deploy TrackVoting
  const TrackVoting = await hre.ethers.getContractFactory("TrackVoting");
  const trackVoting = await TrackVoting.deploy(
    HOST_ADDRESS,
    TRACK_URI,
    PRIZE_TOKEN_ADDRESS,
    PRIZE_AMOUNT
  );

  await trackVoting.waitForDeployment();
  const address = await trackVoting.getAddress();

  console.log("✓ TrackVoting deployed to:", address);

  console.log("\n============================================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("============================================================");
  console.log("TrackVoting:   ", address);
  console.log("Prize Token:   ", PRIZE_TOKEN_ADDRESS);
  console.log("Host:          ", HOST_ADDRESS);
  console.log("Prize:         ", hre.ethers.formatEther(PRIZE_AMOUNT), "MON");
  console.log("============================================================\n");

  console.log("📝 Update your frontend/.env.local:\n");
  console.log(`NEXT_PUBLIC_TRACK_VOTING_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=${PRIZE_TOKEN_ADDRESS}`);
  console.log(`NEXT_PUBLIC_TRACK_HOST=${HOST_ADDRESS}`);
  console.log(`NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz`);
  console.log(`NEXT_PUBLIC_MONAD_CHAIN_ID=10143\n`);

  console.log("⚠️  IMPORTANT: Host must approve TrackVoting contract to spend MON tokens:");
  console.log(`   Call: prizeToken.approve("${address}", "${PRIZE_AMOUNT}")`);
  console.log(`   Or in ethers.js: await prizeToken.approve("${address}", ethers.parseEther("100"))\n`);

  console.log("✅ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
