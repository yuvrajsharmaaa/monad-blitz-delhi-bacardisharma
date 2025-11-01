// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TrackVoting
 * @dev Single track voting and prize distribution system for Monad testnet
 * Manages remixes, voting, and automatic prize distribution for ONE track
 */
contract TrackVoting is ReentrancyGuard {
    // Prize token (MON on Monad testnet)
    IERC20 public immutable prizeToken;
    
    // Track host (uploader) - only they can end voting
    address public immutable host;
    
    // Main track URI
    string public trackURI;
    
    // Prize amount in MON tokens
    uint256 public prizeAmount;
    
    // Voting state
    bool public votingActive = true;
    bool public prizeDistributed = false;
    
    // Winner info
    uint256 public winningRemixId;
    address public winner;
    
    // Remix counter
    uint256 public remixCount;
    
    // Remix ID => Remix data
    struct Remix {
        uint256 id;
        address remixer;
        string remixURI;
        uint256 voteCount;
        bool exists;
    }
    mapping(uint256 => Remix) public remixes;
    
    // Dynamic programming: Cache vote counts for quick access
    // remixId => voteCount (updated incrementally)
    mapping(uint256 => uint256) public voteCache;
    
    // Voter => remixId (tracks what user voted for, 0 = not voted)
    mapping(address => uint256) public voterChoice;
    
    // Voter => hasVoted (prevents double voting)
    mapping(address => bool) public hasVoted;
    
    // Events
    event RemixSubmitted(uint256 indexed remixId, address indexed remixer, string remixURI);
    event VoteCast(address indexed voter, uint256 indexed remixId, uint256 newVoteCount);
    event VotingEnded(uint256 indexed winningRemixId, address indexed winner, uint256 voteCount);
    event PrizeDistributed(address indexed winner, uint256 amount);
    
    /**
     * @dev Constructor - Initialize track with host, URI, and prize
     * @param _host Track uploader (only they can end voting)
     * @param _trackURI Main track URI (IPFS or HTTP)
     * @param _prizeToken MON token contract address on Monad
     * @param _prizeAmount Prize amount in MON wei
     */
    constructor(
        address _host,
        string memory _trackURI,
        address _prizeToken,
        uint256 _prizeAmount
    ) {
        require(_host != address(0), "Invalid host");
        require(_prizeToken != address(0), "Invalid token");
        require(_prizeAmount > 0, "Prize must be > 0");
        
        host = _host;
        trackURI = _trackURI;
        prizeToken = IERC20(_prizeToken);
        prizeAmount = _prizeAmount;
    }
    
    /**
     * @dev Submit a remix to this track
     * @param _remixURI Remix URI (IPFS or HTTP)
     */
    function submitRemix(string calldata _remixURI) external {
        require(votingActive, "Voting ended");
        require(bytes(_remixURI).length > 0, "Empty URI");
        require(msg.sender != host, "Host cannot submit remix");
        
        remixCount++;
        uint256 remixId = remixCount;
        
        remixes[remixId] = Remix({
            id: remixId,
            remixer: msg.sender,
            remixURI: _remixURI,
            voteCount: 0,
            exists: true
        });
        
        // Initialize vote cache
        voteCache[remixId] = 0;
        
        emit RemixSubmitted(remixId, msg.sender, _remixURI);
    }
    
    /**
     * @dev Vote for a remix (one vote per wallet)
     * @param _remixId Remix ID to vote for
     */
    function vote(uint256 _remixId) external {
        require(votingActive, "Voting ended");
        require(!hasVoted[msg.sender], "Already voted");
        require(remixes[_remixId].exists, "Remix not found");
        require(msg.sender != host, "Host cannot vote");
        
        // Mark voter
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _remixId;
        
        // Increment vote count (dynamic programming: incremental update)
        remixes[_remixId].voteCount++;
        voteCache[_remixId]++;
        
        emit VoteCast(msg.sender, _remixId, voteCache[_remixId]);
    }
    
    /**
     * @dev End voting and distribute prize to winner
     * Only host can call this
     */
    function endVoting() external nonReentrant {
        require(msg.sender == host, "Only host can end");
        require(votingActive, "Already ended");
        require(remixCount > 0, "No remixes submitted");
        
        votingActive = false;
        
        // Find winner (remix with most votes)
        uint256 maxVotes = 0;
        uint256 winnerRemixId = 0;
        
        // O(n) scan using cached votes
        for (uint256 i = 1; i <= remixCount; i++) {
            if (voteCache[i] > maxVotes) {
                maxVotes = voteCache[i];
                winnerRemixId = i;
            }
        }
        
        require(winnerRemixId > 0, "No winner found");
        require(maxVotes > 0, "No votes cast");
        
        winningRemixId = winnerRemixId;
        winner = remixes[winnerRemixId].remixer;
        
        emit VotingEnded(winnerRemixId, winner, maxVotes);
        
        // Distribute prize
        _distributePrize();
    }
    
    /**
     * @dev Internal function to transfer prize to winner
     * Transfers from host's allowance to winner
     */
    function _distributePrize() internal {
        require(!prizeDistributed, "Prize already sent");
        require(winner != address(0), "No winner");
        
        prizeDistributed = true;
        
        // Transfer MON tokens from host to winner
        // Host must have approved this contract to spend prizeAmount
        bool success = prizeToken.transferFrom(host, winner, prizeAmount);
        require(success, "Prize transfer failed");
        
        emit PrizeDistributed(winner, prizeAmount);
    }
    
    /**
     * @dev Get all remixes with vote counts
     * @return ids Array of remix IDs
     * @return remixers Array of remixer addresses
     * @return uris Array of remix URIs
     * @return votes Array of vote counts
     */
    function getAllRemixes() external view returns (
        uint256[] memory ids,
        address[] memory remixers,
        string[] memory uris,
        uint256[] memory votes
    ) {
        ids = new uint256[](remixCount);
        remixers = new address[](remixCount);
        uris = new string[](remixCount);
        votes = new uint256[](remixCount);
        
        for (uint256 i = 1; i <= remixCount; i++) {
            Remix memory r = remixes[i];
            ids[i - 1] = r.id;
            remixers[i - 1] = r.remixer;
            uris[i - 1] = r.remixURI;
            votes[i - 1] = voteCache[i]; // Use cached votes
        }
        
        return (ids, remixers, uris, votes);
    }
    
    /**
     * @dev Check if an address has voted
     * @param _voter Address to check
     * @return True if voted, false otherwise
     */
    function hasUserVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }
    
    /**
     * @dev Get vote count for a remix
     * @param _remixId Remix ID
     * @return Vote count
     */
    function getVoteCount(uint256 _remixId) external view returns (uint256) {
        return voteCache[_remixId];
    }
    
    /**
     * @dev Get voting status
     * @return active Whether voting is still active
     * @return distributed Whether prize has been distributed
     * @return winnerAddress Address of the winner
     * @return winningId Winning remix ID
     * @return prizeAmt Prize amount
     */
    function getVotingStatus() external view returns (
        bool active,
        bool distributed,
        address winnerAddress,
        uint256 winningId,
        uint256 prizeAmt
    ) {
        return (votingActive, prizeDistributed, winner, winningRemixId, prizeAmount);
    }
}
