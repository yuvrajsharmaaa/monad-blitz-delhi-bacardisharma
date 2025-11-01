const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * TrackVoting Contract Test Suite
 * Tests all functionality: submission, voting, ending, prize distribution
 */
describe("TrackVoting - Single Track Voting & Prize Distribution", function () {
  let trackVoting;
  let prizeToken;
  let host;
  let remixer1;
  let remixer2;
  let voter1;
  let voter2;
  let voter3;

  const TRACK_URI = "ipfs://QmTestTrackHash123";
  const PRIZE_AMOUNT = ethers.parseEther("100");
  const REMIX_URI_1 = "ipfs://QmRemix1Hash";
  const REMIX_URI_2 = "ipfs://QmRemix2Hash";

  beforeEach(async function () {
    // Get signers
    [host, remixer1, remixer2, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy Prize Token
    const PrizeToken = await ethers.getContractFactory("TestPrizeToken");
    prizeToken = await PrizeToken.deploy();
    await prizeToken.waitForDeployment();

    // Mint tokens to host
    await prizeToken.mint(host.address, ethers.parseEther("1000"));

    // Deploy TrackVoting
    const TrackVoting = await ethers.getContractFactory("TrackVoting");
    trackVoting = await TrackVoting.deploy(
      host.address,
      TRACK_URI,
      await prizeToken.getAddress(),
      PRIZE_AMOUNT
    );
    await trackVoting.waitForDeployment();

    // Host approves contract to spend prize tokens
    await prizeToken.connect(host).approve(
      await trackVoting.getAddress(),
      PRIZE_AMOUNT
    );
  });

  describe("Deployment", function () {
    it("Should set correct host", async function () {
      expect(await trackVoting.host()).to.equal(host.address);
    });

    it("Should set correct track URI", async function () {
      expect(await trackVoting.trackURI()).to.equal(TRACK_URI);
    });

    it("Should set correct prize amount", async function () {
      expect(await trackVoting.prizeAmount()).to.equal(PRIZE_AMOUNT);
    });

    it("Should start with voting active", async function () {
      expect(await trackVoting.votingActive()).to.equal(true);
    });

    it("Should start with zero remixes", async function () {
      expect(await trackVoting.remixCount()).to.equal(0);
    });
  });

  describe("Remix Submission", function () {
    it("Should allow remixer to submit remix", async function () {
      await expect(trackVoting.connect(remixer1).submitRemix(REMIX_URI_1))
        .to.emit(trackVoting, "RemixSubmitted")
        .withArgs(1, remixer1.address, REMIX_URI_1);

      const remix = await trackVoting.remixes(1);
      expect(remix.remixer).to.equal(remixer1.address);
      expect(remix.remixURI).to.equal(REMIX_URI_1);
      expect(remix.voteCount).to.equal(0);
    });

    it("Should increment remix count", async function () {
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      expect(await trackVoting.remixCount()).to.equal(1);

      await trackVoting.connect(remixer2).submitRemix(REMIX_URI_2);
      expect(await trackVoting.remixCount()).to.equal(2);
    });

    it("Should prevent host from submitting remix", async function () {
      await expect(
        trackVoting.connect(host).submitRemix(REMIX_URI_1)
      ).to.be.revertedWith("Host cannot submit remix");
    });

    it("Should prevent empty URI submission", async function () {
      await expect(
        trackVoting.connect(remixer1).submitRemix("")
      ).to.be.revertedWith("Empty URI");
    });

    it("Should prevent submission after voting ends", async function () {
      // Submit a remix and end voting
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(host).endVoting();

      // Try to submit after voting ended
      await expect(
        trackVoting.connect(remixer2).submitRemix(REMIX_URI_2)
      ).to.be.revertedWith("Voting ended");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Submit two remixes
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      await trackVoting.connect(remixer2).submitRemix(REMIX_URI_2);
    });

    it("Should allow user to vote for remix", async function () {
      await expect(trackVoting.connect(voter1).vote(1))
        .to.emit(trackVoting, "VoteCast")
        .withArgs(voter1.address, 1, 1);

      expect(await trackVoting.hasVoted(voter1.address)).to.equal(true);
      expect(await trackVoting.voterChoice(voter1.address)).to.equal(1);
      expect(await trackVoting.voteCache(1)).to.equal(1);
    });

    it("Should increment vote count correctly", async function () {
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(voter2).vote(1);
      await trackVoting.connect(voter3).vote(1);

      expect(await trackVoting.voteCache(1)).to.equal(3);
      const remix = await trackVoting.remixes(1);
      expect(remix.voteCount).to.equal(3);
    });

    it("Should prevent double voting", async function () {
      await trackVoting.connect(voter1).vote(1);

      await expect(
        trackVoting.connect(voter1).vote(2)
      ).to.be.revertedWith("Already voted");
    });

    it("Should prevent voting for non-existent remix", async function () {
      await expect(
        trackVoting.connect(voter1).vote(999)
      ).to.be.revertedWith("Remix not found");
    });

    it("Should prevent host from voting", async function () {
      await expect(
        trackVoting.connect(host).vote(1)
      ).to.be.revertedWith("Host cannot vote");
    });

    it("Should prevent voting after voting ends", async function () {
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(host).endVoting();

      await expect(
        trackVoting.connect(voter2).vote(1)
      ).to.be.revertedWith("Voting ended");
    });
  });

  describe("End Voting & Prize Distribution", function () {
    beforeEach(async function () {
      // Submit remixes
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      await trackVoting.connect(remixer2).submitRemix(REMIX_URI_2);
    });

    it("Should allow host to end voting", async function () {
      // Cast votes (remix 1 gets 2 votes, remix 2 gets 1 vote)
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(voter2).vote(1);
      await trackVoting.connect(voter3).vote(2);

      await expect(trackVoting.connect(host).endVoting())
        .to.emit(trackVoting, "VotingEnded")
        .withArgs(1, remixer1.address, 2);

      expect(await trackVoting.votingActive()).to.equal(false);
      expect(await trackVoting.winner()).to.equal(remixer1.address);
      expect(await trackVoting.winningRemixId()).to.equal(1);
    });

    it("Should transfer prize to winner", async function () {
      // Cast votes
      await trackVoting.connect(voter1).vote(1);

      const balanceBefore = await prizeToken.balanceOf(remixer1.address);

      await expect(trackVoting.connect(host).endVoting())
        .to.emit(trackVoting, "PrizeDistributed")
        .withArgs(remixer1.address, PRIZE_AMOUNT);

      const balanceAfter = await prizeToken.balanceOf(remixer1.address);
      expect(balanceAfter - balanceBefore).to.equal(PRIZE_AMOUNT);
      expect(await trackVoting.prizeDistributed()).to.equal(true);
    });

    it("Should prevent non-host from ending voting", async function () {
      await trackVoting.connect(voter1).vote(1);

      await expect(
        trackVoting.connect(voter1).endVoting()
      ).to.be.revertedWith("Only host can end");
    });

    it("Should prevent ending voting twice", async function () {
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(host).endVoting();

      await expect(
        trackVoting.connect(host).endVoting()
      ).to.be.revertedWith("Already ended");
    });

    it("Should prevent ending with no remixes", async function () {
      // Deploy new contract without remixes
      const TrackVoting = await ethers.getContractFactory("TrackVoting");
      const emptyTrack = await TrackVoting.deploy(
        host.address,
        TRACK_URI,
        await prizeToken.getAddress(),
        PRIZE_AMOUNT
      );

      await expect(
        emptyTrack.connect(host).endVoting()
      ).to.be.revertedWith("No remixes submitted");
    });

    it("Should select winner with highest votes", async function () {
      // Remix 1: 1 vote, Remix 2: 2 votes
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(voter2).vote(2);
      await trackVoting.connect(voter3).vote(2);

      await trackVoting.connect(host).endVoting();

      expect(await trackVoting.winner()).to.equal(remixer2.address);
      expect(await trackVoting.winningRemixId()).to.equal(2);
    });

    it("Should fail if host has insufficient allowance", async function () {
      // Revoke approval
      await prizeToken.connect(host).approve(await trackVoting.getAddress(), 0);

      await trackVoting.connect(voter1).vote(1);

      await expect(
        trackVoting.connect(host).endVoting()
      ).to.be.reverted; // ERC20: insufficient allowance
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      await trackVoting.connect(remixer2).submitRemix(REMIX_URI_2);
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(voter2).vote(1);
      await trackVoting.connect(voter3).vote(2);
    });

    it("Should return all remixes with vote counts", async function () {
      const [ids, remixers, uris, votes] = await trackVoting.getAllRemixes();

      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(1);
      expect(ids[1]).to.equal(2);
      expect(remixers[0]).to.equal(remixer1.address);
      expect(remixers[1]).to.equal(remixer2.address);
      expect(uris[0]).to.equal(REMIX_URI_1);
      expect(uris[1]).to.equal(REMIX_URI_2);
      expect(votes[0]).to.equal(2); // remix 1 has 2 votes
      expect(votes[1]).to.equal(1); // remix 2 has 1 vote
    });

    it("Should check if user has voted", async function () {
      expect(await trackVoting.hasUserVoted(voter1.address)).to.equal(true);
      expect(await trackVoting.hasUserVoted(voter2.address)).to.equal(true);
      expect(await trackVoting.hasUserVoted(remixer1.address)).to.equal(false);
    });

    it("Should return vote count for remix", async function () {
      expect(await trackVoting.getVoteCount(1)).to.equal(2);
      expect(await trackVoting.getVoteCount(2)).to.equal(1);
    });

    it("Should return voting status", async function () {
      const [active, distributed, winner, winningId, prize] =
        await trackVoting.getVotingStatus();

      expect(active).to.equal(true);
      expect(distributed).to.equal(false);
      expect(winner).to.equal(ethers.ZeroAddress);
      expect(winningId).to.equal(0);
      expect(prize).to.equal(PRIZE_AMOUNT);
    });

    it("Should return correct status after voting ends", async function () {
      await trackVoting.connect(host).endVoting();

      const [active, distributed, winner, winningId, prize] =
        await trackVoting.getVotingStatus();

      expect(active).to.equal(false);
      expect(distributed).to.equal(true);
      expect(winner).to.equal(remixer1.address);
      expect(winningId).to.equal(1);
      expect(prize).to.equal(PRIZE_AMOUNT);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle tie in votes (first submitted wins)", async function () {
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      await trackVoting.connect(remixer2).submitRemix(REMIX_URI_2);

      // Both get 1 vote (tie)
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(voter2).vote(2);

      await trackVoting.connect(host).endVoting();

      // First remix with max votes wins (remix 1 checked first)
      expect(await trackVoting.winningRemixId()).to.equal(1);
    });

    it("Should handle single remix submission", async function () {
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      await trackVoting.connect(voter1).vote(1);

      await trackVoting.connect(host).endVoting();

      expect(await trackVoting.winner()).to.equal(remixer1.address);
    });

    it("Should require at least one vote before ending", async function () {
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);

      await expect(
        trackVoting.connect(host).endVoting()
      ).to.be.revertedWith("No winner found");
    });
  });

  describe("Gas Optimization - Vote Caching", function () {
    it("Should use cached votes instead of recomputing", async function () {
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);

      // Cast multiple votes
      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(voter2).vote(1);
      await trackVoting.connect(voter3).vote(1);

      // Check cache is updated
      expect(await trackVoting.voteCache(1)).to.equal(3);

      // getAllRemixes should use cached values (gas efficient)
      const [, , , votes] = await trackVoting.getAllRemixes();
      expect(votes[0]).to.equal(3);
    });

    it("Should maintain cache consistency", async function () {
      await trackVoting.connect(remixer1).submitRemix(REMIX_URI_1);
      await trackVoting.connect(remixer2).submitRemix(REMIX_URI_2);

      await trackVoting.connect(voter1).vote(1);
      await trackVoting.connect(voter2).vote(2);

      const remix1 = await trackVoting.remixes(1);
      const cache1 = await trackVoting.voteCache(1);
      expect(remix1.voteCount).to.equal(cache1);

      const remix2 = await trackVoting.remixes(2);
      const cache2 = await trackVoting.voteCache(2);
      expect(remix2.voteCount).to.equal(cache2);
    });
  });
});
