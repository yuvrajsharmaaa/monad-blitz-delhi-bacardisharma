// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiRemixContest
 * @notice Music remix contest supporting multiple submissions
 * @dev Host creates contest, users submit remixes with payout wallets, voting, and prize distribution
 */
contract MultiRemixContest is ReentrancyGuard {
    
    // ============ State Variables ============
    
    IERC20 public prizeToken;
    uint256 public contestCount;
    uint256 public submissionCount;
    
    // ============ Structs ============
    
    struct Contest {
        uint256 id;
        address host;
        string trackURI;
        uint256 prizeAmount;
        bool active;
        uint256 createdAt;
        uint256 endedAt;
        uint256 winningSubmissionId;
    }
    
    struct Submission {
        uint256 id;
        uint256 contestId;
        address submitter;
        string remixURI;
        address payoutWallet;
        uint256 voteCount;
        uint256 createdAt;
    }
    
    // ============ Storage ============
    
    mapping(uint256 => Contest) public contests;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => uint256[]) public contestSubmissions; // contestId => submissionIds[]
    mapping(uint256 => mapping(address => bool)) public hasVoted; // contestId => voter => voted
    mapping(uint256 => mapping(address => uint256)) public userVote; // contestId => voter => submissionId
    
    // ============ Events ============
    
    event ContestCreated(
        uint256 indexed contestId,
        address indexed host,
        string trackURI,
        uint256 prizeAmount
    );
    
    event RemixSubmitted(
        uint256 indexed submissionId,
        uint256 indexed contestId,
        address indexed submitter,
        string remixURI,
        address payoutWallet
    );
    
    event VoteCast(
        uint256 indexed contestId,
        uint256 indexed submissionId,
        address indexed voter,
        uint256 newVoteCount
    );
    
    event ContestEnded(
        uint256 indexed contestId,
        uint256 indexed winningSubmissionId,
        address indexed winner,
        uint256 prizeAmount
    );
    
    event PrizePaid(
        uint256 indexed contestId,
        uint256 indexed submissionId,
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
            createdAt: block.timestamp,
            endedAt: 0,
            winningSubmissionId: 0
        });
        
        emit ContestCreated(contestId, msg.sender, trackURI, prizeAmount);
        return contestId;
    }
    
    /**
     * @notice Submit a remix to a contest
     */
    function submitRemix(
        uint256 contestId,
        string memory remixURI,
        address payoutWallet
    ) external returns (uint256) {
        Contest storage contest = contests[contestId];
        
        require(contest.active, "Contest not active");
        require(bytes(remixURI).length > 0, "Remix URI required");
        require(payoutWallet != address(0), "Invalid payout wallet");
        
        submissionCount++;
        uint256 submissionId = submissionCount;
        
        submissions[submissionId] = Submission({
            id: submissionId,
            contestId: contestId,
            submitter: msg.sender,
            remixURI: remixURI,
            payoutWallet: payoutWallet,
            voteCount: 0,
            createdAt: block.timestamp
        });
        
        contestSubmissions[contestId].push(submissionId);
        
        emit RemixSubmitted(submissionId, contestId, msg.sender, remixURI, payoutWallet);
        return submissionId;
    }
    
    /**
     * @notice Vote for a submission
     */
    function vote(uint256 contestId, uint256 submissionId) external {
        Contest storage contest = contests[contestId];
        Submission storage submission = submissions[submissionId];
        
        require(contest.active, "Contest not active");
        require(submission.contestId == contestId, "Submission not in this contest");
        require(!hasVoted[contestId][msg.sender], "Already voted");
        
        hasVoted[contestId][msg.sender] = true;
        userVote[contestId][msg.sender] = submissionId;
        submission.voteCount++;
        
        emit VoteCast(contestId, submissionId, msg.sender, submission.voteCount);
    }
    
    /**
     * @notice End contest and pay prize to winner
     */
    function endContestAndPay(uint256 contestId) external nonReentrant {
        Contest storage contest = contests[contestId];
        
        require(contest.active, "Contest not active");
        require(msg.sender == contest.host, "Only host can end contest");
        require(contestSubmissions[contestId].length > 0, "No submissions");
        
        // Find winning submission
        uint256 winningId = 0;
        uint256 maxVotes = 0;
        
        uint256[] memory subs = contestSubmissions[contestId];
        for (uint256 i = 0; i < subs.length; i++) {
            uint256 subId = subs[i];
            if (submissions[subId].voteCount > maxVotes) {
                maxVotes = submissions[subId].voteCount;
                winningId = subId;
            }
        }
        
        require(winningId > 0, "No winner found");
        
        Submission storage winner = submissions[winningId];
        
        // Mark contest as ended
        contest.active = false;
        contest.endedAt = block.timestamp;
        contest.winningSubmissionId = winningId;
        
        // Transfer prize to winner's payout wallet
        uint256 prize = contest.prizeAmount;
        require(
            prizeToken.transfer(winner.payoutWallet, prize),
            "Prize transfer failed"
        );
        
        emit ContestEnded(contestId, winningId, winner.payoutWallet, prize);
        emit PrizePaid(contestId, winningId, winner.payoutWallet, prize);
    }
    
    // ============ View Functions ============
    
    function getContest(uint256 contestId) external view returns (
        uint256 id,
        address host,
        string memory trackURI,
        uint256 prizeAmount,
        bool active,
        uint256 createdAt,
        uint256 endedAt,
        uint256 winningSubmissionId
    ) {
        Contest memory contest = contests[contestId];
        return (
            contest.id,
            contest.host,
            contest.trackURI,
            contest.prizeAmount,
            contest.active,
            contest.createdAt,
            contest.endedAt,
            contest.winningSubmissionId
        );
    }
    
    function getSubmission(uint256 submissionId) external view returns (
        uint256 id,
        uint256 contestId,
        address submitter,
        string memory remixURI,
        address payoutWallet,
        uint256 voteCount,
        uint256 createdAt
    ) {
        Submission memory sub = submissions[submissionId];
        return (
            sub.id,
            sub.contestId,
            sub.submitter,
            sub.remixURI,
            sub.payoutWallet,
            sub.voteCount,
            sub.createdAt
        );
    }
    
    function getContestSubmissions(uint256 contestId) external view returns (uint256[] memory) {
        return contestSubmissions[contestId];
    }
    
    function checkVoted(uint256 contestId, address voter) external view returns (bool) {
        return hasVoted[contestId][voter];
    }
}
