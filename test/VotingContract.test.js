const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract", function () {
  let musicNFT;
  let votingContract;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const MusicNFT = await ethers.getContractFactory("MusicNFT");
    musicNFT = await MusicNFT.deploy();
    await musicNFT.waitForDeployment();
    const musicNFTAddress = await musicNFT.getAddress();

    const VotingContract = await ethers.getContractFactory("VotingContract");
    votingContract = await VotingContract.deploy(musicNFTAddress);
    await votingContract.waitForDeployment();
  });

  describe("Competition creation", function () {
    it("Should create a competition", async function () {
      // Mint original track
      await musicNFT.connect(addr1).mintOriginal("QmOriginal");
      
      // Create competition
      const duration = 86400; // 1 day
      const prizeAmount = ethers.parseEther("1.0");
      await votingContract.connect(addr1).createCompetition(1, duration, prizeAmount);
      
      const comp = await votingContract.getCompetition(1);
      expect(comp.endTime).to.be.gt(0);
      expect(comp.prizeAmount).to.equal(prizeAmount);
    });

    it("Should fail to create competition for non-existent track", async function () {
      await expect(
        votingContract.connect(addr1).createCompetition(999, 86400, ethers.parseEther("1.0"))
      ).to.be.reverted;
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Setup: mint original, create competition, mint remix
      await musicNFT.connect(addr1).mintOriginal("QmOriginal");
      await votingContract.connect(addr1).createCompetition(1, 86400, ethers.parseEther("1.0"));
      await musicNFT.connect(addr2).mintRemix(1, "QmRemix");
      await votingContract.connect(addr2).registerRemix(1, 2);
    });

    it("Should allow voting", async function () {
      await votingContract.connect(addr3).vote(1, 2);
      
      const [remixIds, voteCounts] = await votingContract.tallyVotes(1);
      expect(voteCounts[0]).to.equal(1);
    });

    it("Should prevent double voting", async function () {
      await votingContract.connect(addr3).vote(1, 2);
      await expect(
        votingContract.connect(addr3).vote(1, 2)
      ).to.be.revertedWith("Already voted");
    });

    it("Should use memoized vote counts (dynamic programming)", async function () {
      await votingContract.connect(addr3).vote(1, 2);
      
      // First call
      const [ids1, counts1] = await votingContract.tallyVotes(1);
      
      // Second call should use cache
      const [ids2, counts2] = await votingContract.tallyVotes(1);
      
      expect(counts1[0]).to.equal(counts2[0]);
      expect(counts1[0]).to.equal(1);
    });
  });

  describe("Winner declaration", function () {
    beforeEach(async function () {
      await musicNFT.connect(addr1).mintOriginal("QmOriginal");
      await votingContract.connect(addr1).createCompetition(1, 1, ethers.parseEther("1.0")); // 1 second duration
      await musicNFT.connect(addr2).mintRemix(1, "QmRemix1");
      await musicNFT.connect(addr3).mintRemix(1, "QmRemix2");
      await votingContract.connect(addr2).registerRemix(1, 2);
      await votingContract.connect(addr3).registerRemix(1, 3);
      
      // Add funds for prize
      await owner.sendTransaction({
        to: await votingContract.getAddress(),
        value: ethers.parseEther("1.0")
      });
    });

    it("Should declare winner after competition ends", async function () {
      // Wait for competition to end
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Cast votes
      await votingContract.connect(owner).vote(1, 2);
      await votingContract.connect(addr1).vote(1, 2);
      await votingContract.connect(addr2).vote(1, 3);
      
      // Declare winner
      await votingContract.declareWinner(1);
      
      const comp = await votingContract.getCompetition(1);
      expect(comp.winnerDeclared).to.be.true;
      expect(comp.winnerRemixId).to.equal(2);
    });

    it("Should fail to declare winner before competition ends", async function () {
      await expect(
        votingContract.declareWinner(1)
      ).to.be.revertedWith("Competition not ended");
    });
  });
});

