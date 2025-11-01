const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const MULTI_REMIX_ADDRESS = process.env.NEXT_PUBLIC_MULTI_REMIX_ADDRESS;
  
  if (!MULTI_REMIX_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_MULTI_REMIX_ADDRESS not set");
    process.exit(1);
  }

  console.log("🔍 Verifying Contest #1 Data\n");
  console.log(`Contract: ${MULTI_REMIX_ADDRESS}\n`);
  
  const MultiRemixContest = await ethers.getContractAt("MultiRemixContest", MULTI_REMIX_ADDRESS);
  
  // Get contest details
  console.log("📋 Contest #1:");
  const contest = await MultiRemixContest.getContest(1);
  console.log(`   Host: ${contest.host}`);
  console.log(`   Track URI: ${contest.trackURI}`);
  console.log(`   Prize: ${ethers.formatEther(contest.prizeAmount)} MON`);
  console.log(`   Active: ${contest.active}`);
  console.log(`   Winning Submission ID: ${contest.winningSubmissionId}`);
  
  // Get submissions
  const submissionIds = await MultiRemixContest.getContestSubmissions(1);
  console.log(`\n📝 Submissions: ${submissionIds.length}`);
  
  for (let i = 0; i < submissionIds.length; i++) {
    const subId = submissionIds[i];
    const sub = await MultiRemixContest.getSubmission(Number(subId));
    console.log(`\n🎵 Submission #${subId}:`);
    console.log(`   Submitter: ${sub.submitter}`);
    console.log(`   Remix URI: ${sub.remixURI}`);
    console.log(`   Payout Wallet: ${sub.payoutWallet}`);
    console.log(`   Votes: ${sub.voteCount}`);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Data exists on-chain!");
  console.log("=".repeat(60));
  console.log("\n💡 Make sure you're viewing: http://localhost:3003/battles");
  console.log("   (Not the home page or old /battles route)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
