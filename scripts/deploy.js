const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy MusicNFT
    console.log("\nDeploying MusicNFT...");
    const MusicNFT = await hre.ethers.getContractFactory("MusicNFT");
    const musicNFT = await MusicNFT.deploy();
    await musicNFT.waitForDeployment();
    const musicNFTAddress = await musicNFT.getAddress();
    console.log("MusicNFT deployed to:", musicNFTAddress);

    // Deploy VotingContract
    console.log("\nDeploying VotingContract...");
    const VotingContract = await hre.ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.deploy(musicNFTAddress);
    await votingContract.waitForDeployment();
    const votingContractAddress = await votingContract.getAddress();
    console.log("VotingContract deployed to:", votingContractAddress);

    console.log("\n=== Deployment Summary ===");
    console.log("MusicNFT:", musicNFTAddress);
    console.log("VotingContract:", votingContractAddress);
    console.log("\nSave these addresses in your .env file:");
    console.log(`NEXT_PUBLIC_MUSIC_NFT_ADDRESS=${musicNFTAddress}`);
    console.log(`NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=${votingContractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

