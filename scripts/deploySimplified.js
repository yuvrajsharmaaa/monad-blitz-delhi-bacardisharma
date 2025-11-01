const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimplifiedRemixContest to Monad Testnet...");

  // Get prize token address from environment or use existing
  const PRIZE_TOKEN_ADDRESS = process.env.PRIZE_TOKEN_ADDRESS || "0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5";
  
  console.log("Prize Token Address:", PRIZE_TOKEN_ADDRESS);

  // Deploy SimplifiedRemixContest
  const SimplifiedRemixContest = await hre.ethers.getContractFactory("SimplifiedRemixContest");
  const contest = await SimplifiedRemixContest.deploy(PRIZE_TOKEN_ADDRESS);

  await contest.waitForDeployment();
  const contestAddress = await contest.getAddress();

  console.log("✅ SimplifiedRemixContest deployed to:", contestAddress);
  
  console.log("\n📝 Update your frontend/.env.local:");
  console.log(`NEXT_PUBLIC_SIMPLIFIED_CONTEST_ADDRESS=${contestAddress}`);
  console.log(`NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=${PRIZE_TOKEN_ADDRESS}`);
  
  console.log("\n🎯 Next steps:");
  console.log("1. Update .env.local with the contract address");
  console.log("2. Approve tokens: await tokenContract.approve(contestAddress, amount)");
  console.log("3. Create contest: await contest.createContest(trackURI, prizeAmount)");
  console.log("4. Upload remix: await contest.uploadRemix(contestId, remixURI, payoutWallet)");
  console.log("5. Vote: await contest.vote(contestId)");
  console.log("6. End & Pay: await contest.endContestAndPay(contestId)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
