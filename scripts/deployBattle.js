const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Monad testnet...");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TestPrizeToken
  console.log("\n1. Deploying TestPrizeToken...");
  const TestPrizeToken = await hre.ethers.getContractFactory("TestPrizeToken");
  const prizeToken = await TestPrizeToken.deploy();
  await prizeToken.waitForDeployment();
  const prizeTokenAddress = await prizeToken.getAddress();
  console.log("✓ TestPrizeToken deployed to:", prizeTokenAddress);

  // Deploy MusicNFT
  console.log("\n2. Deploying MusicNFT...");
  const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
  const musicNFT = await MusicNFT.deploy();
  await musicNFT.waitForDeployment();
  const musicNFTAddress = await musicNFT.getAddress();
  console.log("✓ MusicNFT deployed to:", musicNFTAddress);

  // Deploy VotingContract
  console.log("\n3. Deploying VotingContract...");
  const VotingContract = await hre.ethers.getContractFactory("VotingContract");
  const votingContract = await VotingContract.deploy();
  await votingContract.waitForDeployment();
  const votingAddress = await votingContract.getAddress();
  console.log("✓ VotingContract deployed to:", votingAddress);

  // Deploy RemixBattle
  console.log("\n4. Deploying RemixBattle...");
  const RemixBattle = await hre.ethers.getContractFactory("RemixBattle");
  const remixBattle = await RemixBattle.deploy(prizeTokenAddress);
  await remixBattle.waitForDeployment();
  const remixBattleAddress = await remixBattle.getAddress();
  console.log("✓ RemixBattle deployed to:", remixBattleAddress);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("TestPrizeToken:   ", prizeTokenAddress);
  console.log("MusicNFT:         ", musicNFTAddress);
  console.log("VotingContract:   ", votingAddress);
  console.log("RemixBattle:      ", remixBattleAddress);
  console.log("=".repeat(60));

  console.log("\n📝 Update your frontend/.env.local:");
  console.log(`
NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=${prizeTokenAddress}
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=${musicNFTAddress}
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=${votingAddress}
NEXT_PUBLIC_REMIX_BATTLE_ADDRESS=${remixBattleAddress}
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
  `);

  // Mint some test tokens to deployer
  console.log("\n5. Minting test prize tokens...");
  const mintTx = await prizeToken.mint(deployer.address, hre.ethers.parseEther("10000"));
  await mintTx.wait();
  console.log("✓ Minted 10,000 PRIZE tokens to deployer");

  console.log("\n✅ All contracts deployed successfully!");
  console.log("🎉 You can now use the faucet to get test PRIZE tokens");
  console.log(`   Call: prizeToken.faucet() to get 100 PRIZE tokens`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
