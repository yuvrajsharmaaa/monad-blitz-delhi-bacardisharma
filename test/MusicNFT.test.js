const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MusicNFT", function () {
  let musicNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MusicNFT = await ethers.getContractFactory("MusicNFT");
    musicNFT = await MusicNFT.deploy();
    await musicNFT.waitForDeployment();
  });

  describe("Minting", function () {
    it("Should mint an original track", async function () {
      const ipfsHash = "QmTestHash123";
      const tx = await musicNFT.connect(addr1).mintOriginal(ipfsHash);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;
      
      const tokenId = 1;
      const track = await musicNFT.getTrack(tokenId);
      expect(track.creator).to.equal(addr1.address);
      expect(track.isRemix).to.be.false;
      expect(track.remixOf).to.equal(0);
    });

    it("Should mint a remix linked to parent track", async function () {
      const originalIpfsHash = "QmOriginal123";
      const remixIpfsHash = "QmRemix123";
      
      // Mint original
      await musicNFT.connect(addr1).mintOriginal(originalIpfsHash);
      
      // Mint remix
      const tx = await musicNFT.connect(addr2).mintRemix(1, remixIpfsHash);
      await tx.wait();

      const track = await musicNFT.getTrack(2);
      expect(track.isRemix).to.be.true;
      expect(track.remixOf).to.equal(1);
      expect(track.creator).to.equal(addr2.address);
    });

    it("Should fail to mint remix for non-existent parent", async function () {
      await expect(
        musicNFT.connect(addr1).mintRemix(999, "QmHash")
      ).to.be.revertedWith("Parent track does not exist");
    });
  });

  describe("Track retrieval", function () {
    it("Should return creator tracks", async function () {
      await musicNFT.connect(addr1).mintOriginal("QmHash1");
      await musicNFT.connect(addr1).mintOriginal("QmHash2");
      
      const tracks = await musicNFT.getCreatorTracks(addr1.address);
      expect(tracks.length).to.equal(2);
      expect(tracks[0]).to.equal(1);
      expect(tracks[1]).to.equal(2);
    });
  });
});

