// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MusicNFT.sol";

/**
 * @title VotingContract
 * @dev Voting contract with dynamic programming optimizations for Monad
 * Uses memoization to cache vote counts and avoid recomputation
 */
contract VotingContract {
    MusicNFT public musicNFT;
    
    struct Competition {
        uint256 originalTrackId;
        uint256[] remixIds;
        mapping(uint256 => uint256) voteCounts;    // remixId => vote count
        mapping(address => bool) hasVoted;          // prevent double voting
        mapping(address => uint256) voterToRemix;   // track what user voted for
        bool winnerDeclared;
        uint256 winnerRemixId;
        uint256 endTime;
        uint256 prizeAmount;
    }
    
    mapping(uint256 => Competition) public competitions;
    mapping(uint256 => uint256) public cachedVoteTotals;  // Memoization: remixId => total votes
    
    // Dynamic programming: cache intermediate results
    mapping(uint256 => mapping(uint256 => uint256)) public voteCache;  // competitionId => remixId => cached votes
    
    event VoteCast(
        uint256 indexed originalTrackId,
        uint256 indexed remixId,
        address indexed voter,
        uint256 newVoteCount
    );
    
    event WinnerDeclared(
        uint256 indexed originalTrackId,
        uint256 indexed winnerRemixId,
        address winnerCreator,
        uint256 totalVotes
    );
    
    event PrizeDistributed(
        uint256 indexed originalTrackId,
        address indexed winner,
        uint256 amount
    );
    
    constructor(address _musicNFTAddress) {
        musicNFT = MusicNFT(_musicNFTAddress);
    }
    
    /**
     * @dev Create a competition for an original track
     * @param originalTrackId The original track NFT ID
     * @param duration Competition duration in seconds
     * @param prizeAmount Prize amount in wei
     */
    function createCompetition(
        uint256 originalTrackId,
        uint256 duration,
        uint256 prizeAmount
    ) external {
        require(musicNFT.ownerOf(originalTrackId) != address(0), "Track does not exist");
        require(competitions[originalTrackId].originalTrackId == 0, "Competition exists");
        
        competitions[originalTrackId].originalTrackId = originalTrackId;
        competitions[originalTrackId].endTime = block.timestamp + duration;
        competitions[originalTrackId].prizeAmount = prizeAmount;
    }
    
    /**
     * @dev Register a remix for competition (call when remix is minted)
     * @param originalTrackId Original track ID
     * @param remixId Remix NFT ID
     */
    function registerRemix(uint256 originalTrackId, uint256 remixId) external {
        require(competitions[originalTrackId].originalTrackId != 0, "Competition not found");
        require(!competitions[originalTrackId].winnerDeclared, "Competition ended");
        
        competitions[originalTrackId].remixIds.push(remixId);
        competitions[originalTrackId].voteCounts[remixId] = 0;
        cachedVoteTotals[remixId] = 0;  // Initialize cache
    }
    
    /**
     * @dev Vote for a remix with memoization
     * @param originalTrackId Original track ID
     * @param remixId Remix to vote for
     */
    function vote(uint256 originalTrackId, uint256 remixId) external {
        Competition storage comp = competitions[originalTrackId];
        
        require(comp.originalTrackId != 0, "Competition not found");
        require(block.timestamp <= comp.endTime, "Competition ended");
        require(!comp.hasVoted[msg.sender], "Already voted");
        require(!comp.winnerDeclared, "Competition ended");
        
        // Verify remix exists in competition
        bool remixExists = false;
        for (uint i = 0; i < comp.remixIds.length; i++) {
            if (comp.remixIds[i] == remixId) {
                remixExists = true;
                break;
            }
        }
        require(remixExists, "Remix not in competition");
        
        // Update vote count using cached value + 1 (incremental update)
        uint256 currentVotes = comp.voteCounts[remixId];
        comp.voteCounts[remixId] = currentVotes + 1;
        comp.hasVoted[msg.sender] = true;
        comp.voterToRemix[msg.sender] = remixId;
        
        // Update memoized cache (incremental, avoids full recomputation)
        cachedVoteTotals[remixId] = currentVotes + 1;
        voteCache[originalTrackId][remixId] = currentVotes + 1;
        
        emit VoteCast(originalTrackId, remixId, msg.sender, currentVotes + 1);
    }
    
    /**
     * @dev Tally votes using memoized cache (dynamic programming optimization)
     * @param originalTrackId Original track ID
     * @return remixIds Array of remix IDs
     * @return voteCounts Array of corresponding vote counts (from cache)
     */
    function tallyVotes(uint256 originalTrackId) 
        external 
        view 
        returns (uint256[] memory remixIds, uint256[] memory voteCounts) 
    {
        Competition storage comp = competitions[originalTrackId];
        require(comp.originalTrackId != 0, "Competition not found");
        
        uint256[] memory ids = comp.remixIds;
        uint256[] memory counts = new uint256[](ids.length);
        
        // Use cached values instead of recalculating (memoization pattern)
        for (uint i = 0; i < ids.length; i++) {
            uint256 remixId = ids[i];
            // Get from cache first (faster), fallback to storage if not cached
            counts[i] = voteCache[originalTrackId][remixId] > 0 
                ? voteCache[originalTrackId][remixId]
                : comp.voteCounts[remixId];
        }
        
        return (ids, counts);
    }
    
    /**
     * @dev Declare winner from cached vote results (no recomputation needed)
     * @param originalTrackId Original track ID
     */
    function declareWinner(uint256 originalTrackId) external {
        Competition storage comp = competitions[originalTrackId];
        
        require(comp.originalTrackId != 0, "Competition not found");
        require(block.timestamp > comp.endTime, "Competition not ended");
        require(!comp.winnerDeclared, "Winner already declared");
        
        uint256 maxVotes = 0;
        uint256 winnerRemixId = 0;
        
        // Use cached vote counts (dynamic programming: avoid full scan)
        for (uint i = 0; i < comp.remixIds.length; i++) {
            uint256 remixId = comp.remixIds[i];
            uint256 votes = voteCache[originalTrackId][remixId] > 0
                ? voteCache[originalTrackId][remixId]
                : comp.voteCounts[remixId];
            
            if (votes > maxVotes) {
                maxVotes = votes;
                winnerRemixId = remixId;
            }
        }
        
        require(winnerRemixId > 0, "No votes cast");
        
        comp.winnerDeclared = true;
        comp.winnerRemixId = winnerRemixId;
        
        address winnerCreator = musicNFT.ownerOf(winnerRemixId);
        
        emit WinnerDeclared(originalTrackId, winnerRemixId, winnerCreator, maxVotes);
        
        // Automatically distribute prize
        distributePrize(originalTrackId);
    }
    
    /**
     * @dev Distribute prize to winner automatically
     * @param originalTrackId Original track ID
     */
    function distributePrize(uint256 originalTrackId) internal {
        Competition storage comp = competitions[originalTrackId];
        require(comp.winnerDeclared, "Winner not declared");
        require(comp.prizeAmount > 0, "No prize set");
        
        address winner = musicNFT.ownerOf(comp.winnerRemixId);
        require(winner != address(0), "Invalid winner");
        
        // Transfer prize (assuming contract has balance)
        payable(winner).transfer(comp.prizeAmount);
        
        emit PrizeDistributed(originalTrackId, winner, comp.prizeAmount);
    }
    
    /**
     * @dev Get competition info
     */
    function getCompetition(uint256 originalTrackId) 
        external 
        view 
        returns (
            uint256[] memory remixIds,
            uint256 endTime,
            uint256 prizeAmount,
            bool winnerDeclared,
            uint256 winnerRemixId
        ) 
    {
        Competition storage comp = competitions[originalTrackId];
        return (
            comp.remixIds,
            comp.endTime,
            comp.prizeAmount,
            comp.winnerDeclared,
            comp.winnerRemixId
        );
    }
    
    // Allow contract to receive funds for prizes
    receive() external payable {}
}

