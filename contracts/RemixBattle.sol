// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RemixBattle
 * @notice On-chain remix competition with voting and prize distribution on Monad testnet
 */
contract RemixBattle is Ownable, ReentrancyGuard {
    IERC20 public prizeToken;
    
    struct Battle {
        address host;
        string trackURI;
        uint256 prizeAmount;
        bool active;
        address winnerAddress;
        uint256 createdAt;
        uint256 endedAt;
        uint256 submissionCount;
    }
    
    struct RemixSubmission {
        uint256 submissionId;
        uint256 battleId;
        address remixer;
        string remixURI;
        uint256 votes;
        uint256 createdAt;
    }
    
    // State variables
    uint256 public battleCount;
    uint256 public submissionCount;
    
    mapping(uint256 => Battle) public battles;
    mapping(uint256 => RemixSubmission) public submissions;
    mapping(uint256 => uint256[]) public battleSubmissions; // battleId => submissionIds
    mapping(uint256 => mapping(address => bool)) public hasVoted; // battleId => voter => voted
    mapping(uint256 => mapping(uint256 => bool)) public battleHasSubmission; // battleId => submissionId => exists
    
    // Events
    event BattleCreated(uint256 indexed battleId, address indexed host, string trackURI, uint256 prizeAmount);
    event RemixSubmitted(uint256 indexed battleId, uint256 indexed submissionId, address indexed remixer, string remixURI);
    event VoteCast(uint256 indexed battleId, uint256 indexed submissionId, address indexed voter, uint256 newVoteCount);
    event BattleEnded(uint256 indexed battleId, uint256 indexed winningSubmissionId, address indexed winner, uint256 prizeAmount);
    event PrizeDistributed(uint256 indexed battleId, address indexed winner, uint256 amount);
    
    constructor(address _prizeToken) Ownable(msg.sender) {
        require(_prizeToken != address(0), "Invalid token address");
        prizeToken = IERC20(_prizeToken);
    }
    
    /**
     * @notice Create a new remix battle
     * @param trackURI IPFS URI of the main track
     * @param prizeAmount Amount of prize tokens to award winner
     */
    function createBattle(string memory trackURI, uint256 prizeAmount) external nonReentrant returns (uint256) {
        require(bytes(trackURI).length > 0, "Track URI required");
        require(prizeAmount > 0, "Prize amount must be > 0");
        
        // Transfer prize tokens from host to contract
        require(
            prizeToken.transferFrom(msg.sender, address(this), prizeAmount),
            "Prize token transfer failed"
        );
        
        battleCount++;
        uint256 battleId = battleCount;
        
        battles[battleId] = Battle({
            host: msg.sender,
            trackURI: trackURI,
            prizeAmount: prizeAmount,
            active: true,
            winnerAddress: address(0),
            createdAt: block.timestamp,
            endedAt: 0,
            submissionCount: 0
        });
        
        emit BattleCreated(battleId, msg.sender, trackURI, prizeAmount);
        return battleId;
    }
    
    /**
     * @notice Submit a remix to an active battle
     * @param battleId ID of the battle
     * @param remixURI IPFS URI of the remix
     */
    function submitRemix(uint256 battleId, string memory remixURI) external returns (uint256) {
        Battle storage battle = battles[battleId];
        require(battle.active, "Battle not active");
        require(bytes(remixURI).length > 0, "Remix URI required");
        require(msg.sender != battle.host, "Host cannot submit remix");
        
        submissionCount++;
        uint256 submissionId = submissionCount;
        
        submissions[submissionId] = RemixSubmission({
            submissionId: submissionId,
            battleId: battleId,
            remixer: msg.sender,
            remixURI: remixURI,
            votes: 0,
            createdAt: block.timestamp
        });
        
        battleSubmissions[battleId].push(submissionId);
        battleHasSubmission[battleId][submissionId] = true;
        battle.submissionCount++;
        
        emit RemixSubmitted(battleId, submissionId, msg.sender, remixURI);
        return submissionId;
    }
    
    /**
     * @notice Vote for a remix submission
     * @param battleId ID of the battle
     * @param submissionId ID of the submission to vote for
     */
    function voteRemix(uint256 battleId, uint256 submissionId) external {
        Battle storage battle = battles[battleId];
        require(battle.active, "Battle not active");
        require(!hasVoted[battleId][msg.sender], "Already voted in this battle");
        require(battleHasSubmission[battleId][submissionId], "Invalid submission");
        
        RemixSubmission storage submission = submissions[submissionId];
        require(submission.battleId == battleId, "Submission not in this battle");
        
        hasVoted[battleId][msg.sender] = true;
        submission.votes++;
        
        emit VoteCast(battleId, submissionId, msg.sender, submission.votes);
    }
    
    /**
     * @notice End the battle and determine winner (host only)
     * @param battleId ID of the battle to end
     */
    function endBattle(uint256 battleId) external nonReentrant {
        Battle storage battle = battles[battleId];
        require(battle.active, "Battle not active");
        require(msg.sender == battle.host, "Only host can end battle");
        require(battle.submissionCount > 0, "No submissions");
        
        battle.active = false;
        battle.endedAt = block.timestamp;
        
        // Find winner (submission with most votes)
        uint256[] memory subs = battleSubmissions[battleId];
        uint256 winningSubmissionId = subs[0];
        uint256 maxVotes = submissions[subs[0]].votes;
        
        for (uint256 i = 1; i < subs.length; i++) {
            if (submissions[subs[i]].votes > maxVotes) {
                maxVotes = submissions[subs[i]].votes;
                winningSubmissionId = subs[i];
            }
        }
        
        battle.winnerAddress = submissions[winningSubmissionId].remixer;
        
        emit BattleEnded(battleId, winningSubmissionId, battle.winnerAddress, battle.prizeAmount);
        
        // Auto-distribute prize
        _distributePrize(battleId);
    }
    
    /**
     * @notice Internal function to distribute prize to winner
     * @param battleId ID of the battle
     */
    function _distributePrize(uint256 battleId) internal {
        Battle storage battle = battles[battleId];
        require(!battle.active, "Battle still active");
        require(battle.winnerAddress != address(0), "No winner determined");
        require(battle.prizeAmount > 0, "No prize to distribute");
        
        uint256 prize = battle.prizeAmount;
        battle.prizeAmount = 0; // Prevent re-distribution
        
        require(
            prizeToken.transfer(battle.winnerAddress, prize),
            "Prize transfer failed"
        );
        
        emit PrizeDistributed(battleId, battle.winnerAddress, prize);
    }
    
    /**
     * @notice Get all submissions for a battle
     * @param battleId ID of the battle
     */
    function getBattleSubmissions(uint256 battleId) external view returns (uint256[] memory) {
        return battleSubmissions[battleId];
    }
    
    /**
     * @notice Get submission details
     * @param submissionId ID of the submission
     */
    function getSubmission(uint256 submissionId) external view returns (RemixSubmission memory) {
        return submissions[submissionId];
    }
    
    /**
     * @notice Get battle details
     * @param battleId ID of the battle
     */
    function getBattle(uint256 battleId) external view returns (Battle memory) {
        return battles[battleId];
    }
    
    /**
     * @notice Check if an address has voted in a battle
     * @param battleId ID of the battle
     * @param voter Address to check
     */
    function hasVotedInBattle(uint256 battleId, address voter) external view returns (bool) {
        return hasVoted[battleId][voter];
    }
    
    /**
     * @notice Get leaderboard for a battle (sorted by votes)
     * @param battleId ID of the battle
     */
    function getLeaderboard(uint256 battleId) external view returns (
        uint256[] memory submissionIds,
        uint256[] memory votes
    ) {
        uint256[] memory subs = battleSubmissions[battleId];
        uint256 len = subs.length;
        
        submissionIds = new uint256[](len);
        votes = new uint256[](len);
        
        // Copy data
        for (uint256 i = 0; i < len; i++) {
            submissionIds[i] = subs[i];
            votes[i] = submissions[subs[i]].votes;
        }
        
        // Bubble sort by votes (descending)
        for (uint256 i = 0; i < len; i++) {
            for (uint256 j = i + 1; j < len; j++) {
                if (votes[j] > votes[i]) {
                    // Swap votes
                    uint256 tempVote = votes[i];
                    votes[i] = votes[j];
                    votes[j] = tempVote;
                    
                    // Swap IDs
                    uint256 tempId = submissionIds[i];
                    submissionIds[i] = submissionIds[j];
                    submissionIds[j] = tempId;
                }
            }
        }
        
        return (submissionIds, votes);
    }
    
    /**
     * @notice Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
}
