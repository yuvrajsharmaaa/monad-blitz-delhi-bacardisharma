// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimplifiedRemixContest
 * @notice MVP music remix contest with single remix submission per battle
 * @dev Host uploads remix with payout wallet, users vote, host ends battle and distributes prize
 */
contract SimplifiedRemixContest is ReentrancyGuard {
    
    // ============ State Variables ============
    
    IERC20 public prizeToken;
    uint256 public contestCount;
    
    // ============ Structs ============
    
    struct Contest {
        uint256 id;
        address host;                    // Contest creator
        string trackURI;                 // Original track URI
        uint256 prizeAmount;             // Prize in tokens
        bool active;                     // Contest is active
        
        // Remix submission
        string remixURI;                 // Remix file URI
        address payoutWallet;            // Wallet to receive prize (input by uploader)
        uint256 voteCount;               // Total votes for the remix
        
        // Contest end data
        uint256 createdAt;
        uint256 endedAt;
        bytes32 payoutTxHash;            // Transaction hash of payout (stored as event)
    }
    
    // ============ Storage ============
    
    mapping(uint256 => Contest) public contests;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // contestId => voter => voted
    
    // ============ Events ============
    
    event ContestCreated(
        uint256 indexed contestId,
        address indexed host,
        string trackURI,
        uint256 prizeAmount
    );
    
    event RemixUploaded(
        uint256 indexed contestId,
        string remixURI,
        address indexed payoutWallet
    );
    
    event VoteCast(
        uint256 indexed contestId,
        address indexed voter,
        uint256 newVoteCount
    );
    
    event ContestEnded(
        uint256 indexed contestId,
        address indexed winner,
        uint256 prizeAmount,
        bytes32 indexed txHash
    );
    
    event PrizePaid(
        uint256 indexed contestId,
        address indexed recipient,
        uint256 amount
    );
    
    // ============ Constructor ============
    
    constructor(address _prizeToken) {
        require(_prizeToken != address(0), "Invalid token address");
        prizeToken = IERC20(_prizeToken);
    }
    
    // ============ Main Functions ============
    
    /**
     * @notice Create a new remix contest
     * @param trackURI URI of the original track
     * @param prizeAmount Amount of prize tokens (must approve first)
     */
    function createContest(
        string memory trackURI,
        uint256 prizeAmount
    ) external nonReentrant returns (uint256) {
        require(bytes(trackURI).length > 0, "Track URI required");
        require(prizeAmount > 0, "Prize amount must be > 0");
        
        // Transfer prize tokens from host to contract
        require(
            prizeToken.transferFrom(msg.sender, address(this), prizeAmount),
            "Prize transfer failed"
        );
        
        contestCount++;
        uint256 contestId = contestCount;
        
        contests[contestId] = Contest({
            id: contestId,
            host: msg.sender,
            trackURI: trackURI,
            prizeAmount: prizeAmount,
            active: true,
            remixURI: "",
            payoutWallet: address(0),
            voteCount: 0,
            createdAt: block.timestamp,
            endedAt: 0,
            payoutTxHash: bytes32(0)
        });
        
        emit ContestCreated(contestId, msg.sender, trackURI, prizeAmount);
        return contestId;
    }
    
    /**
     * @notice Upload remix with payout wallet address
     * @param contestId ID of the contest
     * @param remixURI URI of the remix file
     * @param payoutWallet Wallet address that will receive the prize
     */
    function uploadRemix(
        uint256 contestId,
        string memory remixURI,
        address payoutWallet
    ) external {
        Contest storage contest = contests[contestId];
        
        require(contest.active, "Contest not active");
        require(msg.sender == contest.host, "Only host can upload remix");
        require(bytes(contest.remixURI).length == 0, "Remix already uploaded");
        require(bytes(remixURI).length > 0, "Remix URI required");
        require(payoutWallet != address(0), "Invalid payout wallet");
        
        contest.remixURI = remixURI;
        contest.payoutWallet = payoutWallet;
        
        emit RemixUploaded(contestId, remixURI, payoutWallet);
    }
    
    /**
     * @notice Vote for the remix (one vote per wallet)
     * @param contestId ID of the contest
     */
    function vote(uint256 contestId) external {
        Contest storage contest = contests[contestId];
        
        require(contest.active, "Contest not active");
        require(bytes(contest.remixURI).length > 0, "No remix uploaded yet");
        require(!hasVoted[contestId][msg.sender], "Already voted");
        
        // Mark as voted (memoization for gas optimization)
        hasVoted[contestId][msg.sender] = true;
        
        // Increment vote count
        contest.voteCount++;
        
        emit VoteCast(contestId, msg.sender, contest.voteCount);
    }
    
    /**
     * @notice End contest and pay prize to winner
     * @param contestId ID of the contest to end
     */
    function endContestAndPay(uint256 contestId) external nonReentrant {
        Contest storage contest = contests[contestId];
        
        require(contest.active, "Contest not active");
        require(msg.sender == contest.host, "Only host can end contest");
        require(bytes(contest.remixURI).length > 0, "No remix uploaded");
        require(contest.payoutWallet != address(0), "No payout wallet set");
        
        // Mark contest as ended
        contest.active = false;
        contest.endedAt = block.timestamp;
        
        // Store the transaction hash (will be set in event)
        bytes32 txHash = keccak256(abi.encodePacked(
            block.timestamp,
            contestId,
            contest.payoutWallet,
            contest.prizeAmount
        ));
        contest.payoutTxHash = txHash;
        
        // Transfer prize to payout wallet
        uint256 prize = contest.prizeAmount;
        require(
            prizeToken.transfer(contest.payoutWallet, prize),
            "Prize transfer failed"
        );
        
        emit ContestEnded(contestId, contest.payoutWallet, prize, txHash);
        emit PrizePaid(contestId, contest.payoutWallet, prize);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get contest details
     * @param contestId ID of the contest
     */
    function getContest(uint256 contestId) external view returns (
        uint256 id,
        address host,
        string memory trackURI,
        uint256 prizeAmount,
        bool active,
        string memory remixURI,
        address payoutWallet,
        uint256 voteCount,
        uint256 createdAt,
        uint256 endedAt
    ) {
        Contest memory contest = contests[contestId];
        return (
            contest.id,
            contest.host,
            contest.trackURI,
            contest.prizeAmount,
            contest.active,
            contest.remixURI,
            contest.payoutWallet,
            contest.voteCount,
            contest.createdAt,
            contest.endedAt
        );
    }
    
    /**
     * @notice Check if a user has voted
     * @param contestId ID of the contest
     * @param voter Address of the voter
     */
    function checkVoted(uint256 contestId, address voter) external view returns (bool) {
        return hasVoted[contestId][voter];
    }
    
    /**
     * @notice Get total number of contests
     */
    function getTotalContests() external view returns (uint256) {
        return contestCount;
    }
}
