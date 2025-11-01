const hre = require('hardhat');

/**
 * Get test MON tokens from the faucet
 * TestPrizeToken has a faucet() function that gives 100 tokens per call
 */
async function main() {
  console.log('\n💰 Getting test MON tokens from faucet...\n');

  const [signer] = await hre.ethers.getSigners();
  console.log('📍 Your address:', signer.address);

  // TestPrizeToken address (already deployed)
  const TOKEN_ADDRESS = '0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5';

  // Connect to token contract
  const token = await hre.ethers.getContractAt('TestPrizeToken', TOKEN_ADDRESS);
  
  // Check current balance
  const balanceBefore = await token.balanceOf(signer.address);
  console.log('💵 Balance before:', hre.ethers.formatEther(balanceBefore), 'MON');

  // Call faucet (gives 100 tokens)
  console.log('\n🚰 Calling faucet...');
  const tx = await token.faucet();
  console.log('⏳ Transaction hash:', tx.hash);
  
  await tx.wait();
  console.log('✅ Transaction confirmed!');

  // Check new balance
  const balanceAfter = await token.balanceOf(signer.address);
  console.log('\n💰 Balance after:', hre.ethers.formatEther(balanceAfter), 'MON');
  console.log('📈 Received:', hre.ethers.formatEther(balanceAfter - balanceBefore), 'MON');

  console.log('\n🎉 Success! You can now use these tokens for prizes.\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
