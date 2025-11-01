const hre = require("hardhat");

async function main() {
  console.log("Deploying MultiRemixContest...");

  const prizeTokenAddress = process.env.PRIZE_TOKEN_ADDRESS || "0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5";
  
  console.log(`Using Prize Token: ${prizeTokenAddress}`);

  const MultiRemixContest = await hre.ethers.getContractFactory("MultiRemixContest");
  const contract = await MultiRemixContest.deploy(prizeTokenAddress);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ MultiRemixContest deployed to:", contractAddress);
  console.log("\n📝 Add this to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_MULTI_REMIX_ADDRESS=${contractAddress}`);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
