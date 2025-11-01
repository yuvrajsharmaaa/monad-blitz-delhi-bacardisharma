# Single Track Voting System - Complete Guide

## 🎯 Overview

A streamlined, production-ready voting and prize distribution system for **ONE track** on Monad testnet. Everything happens on a single page:
- Submit remixes
- Vote on-chain
- Host ends voting
- Automatic prize distribution to winner

## 📋 Architecture

### Smart Contract: `TrackVoting.sol`

**Key Features:**
- Single track with multiple remixes
- One vote per wallet address
- Automatic winner selection (most votes)
- Automatic MON token prize distribution
- Host-only voting termination
- Real-time vote counting with caching

**Functions:**
```solidity
// Public functions
submitRemix(string remixURI)           // Submit a remix
vote(uint256 remixId)                  // Vote for a remix
endVoting()                            // End voting & distribute prize (host only)

// View functions
getAllRemixes()                        // Get all remixes with vote counts
hasUserVoted(address voter)            // Check if user voted
getVotingStatus()                      // Get current status
```

### Frontend: `SingleTrackVoting.js`

**Features:**
- Real-time vote updates via contract events
- Submit remix form
- Vote buttons for each remix
- End voting button (host only)
- Winner display
- Prize distribution status
- Automatic MON token approval

## 🚀 Deployment Guide

### Step 1: Configure Environment

Create/update `frontend/.env.local`:

```bash
# Monad Testnet Configuration
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME=Monad Testnet

# Prize Token (MON) - Already deployed
NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5

# TrackVoting Contract (deploy below)
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=

# Backend (optional)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
NEXT_PUBLIC_BACKEND_ONLY=false
```

Create/update root `.env`:

```bash
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=your_private_key_here
```

### Step 2: Compile Contract

```bash
npx hardhat compile
```

### Step 3: Deploy to Monad Testnet

```bash
npx hardhat run scripts/deployTrackVoting.js --network monad
```

**Example Output:**
```
Deploying TrackVoting to Monad testnet...

Deploying with account: 0xYourAddress
Configuration:
Host: 0xYourAddress
Track URI: ipfs://QmExampleTrackHash123
Prize Token: 0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
Prize Amount: 100 MON

✓ TrackVoting deployed to: 0xNewContractAddress

📝 Update your frontend/.env.local:
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0xNewContractAddress
```

### Step 4: Update Frontend Config

Copy the deployed address to `frontend/.env.local`:

```bash
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0xNewContractAddress
```

### Step 5: Get MON Tokens (Prize Token)

```bash
# Option 1: Use the faucet in the app
# Navigate to "Remix Battles" tab → Click "Claim 100 PRIZE"

# Option 2: Call faucet directly
npx hardhat console --network monad
> const Token = await ethers.getContractFactory("TestPrizeToken")
> const token = Token.attach("0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5")
> await token.faucet()
```

## 📱 Usage Guide

### For Track Host (Uploader)

**1. Deploy the Contract**
```bash
npx hardhat run scripts/deployTrackVoting.js --network monad
```

**2. Get MON Tokens**
- You need at least the prize amount (e.g., 100 MON)
- Use the faucet or get from another source

**3. Navigate to Track Voting Page**
- Go to http://localhost:3001
- Click "🗳️ Track Voting" tab
- Connect your wallet

**4. Monitor Submissions**
- Watch as users submit remixes
- See real-time vote counts

**5. End Voting**
- Click "🏁 End Voting & Distribute Prize"
- Contract will automatically:
  - Request token approval (if needed)
  - Approve prize tokens
  - Find winner (most votes)
  - Transfer prize to winner
  - Emit events

### For Remix Submitters

**1. Connect Wallet**
- Go to http://localhost:3001
- Click "🗳️ Track Voting" tab
- Connect MetaMask to Monad testnet

**2. Submit Remix**
- Click "📤 Submit Remix"
- Enter your remix URI (e.g., `ipfs://QmYourHash` or `http://...`)
- Confirm transaction
- Wait for confirmation

**3. Vote (Optional)**
- You can vote for any remix (including your own)
- One vote per wallet address
- Click "🗳️ Vote for this Remix"
- Confirm transaction

### For Voters

**1. Browse Remixes**
- Navigate to Track Voting page
- See all submitted remixes with vote counts
- Remixes sorted by votes (highest first)

**2. Cast Vote**
- Click "🗳️ Vote for this Remix" on your favorite
- Confirm transaction
- Vote recorded on-chain
- Can only vote once per wallet

**3. Watch Results**
- See real-time vote updates
- Winner announced when host ends voting
- Prize automatically sent to winner

## 🔧 Technical Details

### Contract Flow

```
1. DEPLOYMENT
   └─> Host deploys with track URI + prize amount
   └─> Contract initialized, voting active

2. REMIX SUBMISSION
   └─> Users call submitRemix(uri)
   └─> Remix stored with ID
   └─> Host cannot submit (prevented)

3. VOTING
   └─> Users call vote(remixId)
   └─> Vote count incremented
   └─> Voter marked as voted
   └─> Event emitted with new count

4. END VOTING (Host only)
   └─> Host calls endVoting()
   └─> Contract scans all remixes
   └─> Finds highest vote count
   └─> Marks winner
   └─> Transfers prize tokens (host → winner)
   └─> Emits VotingEnded + PrizeDistributed events
```

### Token Approval Flow

```
Host needs to approve contract to spend MON tokens:

1. Manual Approval (before ending):
   await prizeToken.approve(trackVotingAddress, prizeAmount)

2. Automatic Approval (in frontend):
   - Frontend checks allowance
   - If insufficient, prompts approval
   - Then calls endVoting()
```

### Events for Real-Time Updates

```solidity
event RemixSubmitted(uint256 indexed remixId, address indexed remixer, string remixURI)
event VoteCast(address indexed voter, uint256 indexed remixId, uint256 newVoteCount)
event VotingEnded(uint256 indexed winningRemixId, address indexed winner, uint256 voteCount)
event PrizeDistributed(address indexed winner, uint256 amount)
```

Frontend listens to these events and updates UI automatically.

### Gas Optimization

- **Vote caching**: Vote counts stored in mapping for O(1) access
- **Incremental updates**: Votes updated incrementally, not recalculated
- **Minimal storage**: Only essential data on-chain
- **Efficient winner selection**: Single O(n) scan at end

## 🎨 Frontend Features

### Real-Time Updates
- Contract events trigger UI updates
- No manual refresh needed
- Vote counts update live

### Status Indicators
- 🟢 VOTING ACTIVE
- 🔴 VOTING ENDED
- 💰 PRIZE DISTRIBUTED

### Winner Display
- 🏆 Trophy banner
- Winner address
- Prize amount
- Distribution status

### Ranking
- 🥇 1st place (most votes)
- 🥈 2nd place
- 🥉 3rd place

### User Experience
- ✅ Transaction status notifications
- ⏳ Pending indicators
- ❌ Error messages
- Disabled buttons for completed actions

## 🛡️ Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks on endVoting
2. **Host-only ending**: Only track host can end voting
3. **Single vote**: Each address can only vote once
4. **Host exclusion**: Host cannot submit remixes or vote
5. **Safe token transfer**: Uses OpenZeppelin's IERC20
6. **Existence checks**: Verifies remix exists before voting

## 📊 Example Scenario

### Complete Flow

```bash
# 1. Host deploys contract
npx hardhat run scripts/deployTrackVoting.js --network monad
# Output: Contract at 0xABC123...

# 2. Alice submits remix
submitRemix("ipfs://QmAliceRemix")
# Remix #1 created

# 3. Bob submits remix
submitRemix("ipfs://QmBobRemix")
# Remix #2 created

# 4. Users vote
vote(1)  // Carol votes for Alice
vote(1)  // Dave votes for Alice
vote(2)  // Eve votes for Bob

# Current state:
# Remix #1 (Alice): 2 votes 🥇
# Remix #2 (Bob): 1 vote

# 5. Host ends voting
endVoting()
# → Contract finds Alice as winner (2 votes)
# → Transfers 100 MON from host to Alice
# → Emits events

# Result: Alice receives 100 MON tokens
```

## 🐛 Troubleshooting

### "Already voted"
- Each wallet can only vote once
- Use a different wallet to vote again

### "Only host can end"
- Only the track uploader (host) can end voting
- Connect with the host wallet

### "Remix not found"
- Invalid remix ID
- Check getAllRemixes() for valid IDs

### "Host cannot submit remix"
- Track host cannot participate as a remixer
- Use a different wallet to submit

### "Prize transfer failed"
- Host didn't approve contract to spend tokens
- Call: `prizeToken.approve(trackVotingAddress, prizeAmount)`
- Or let frontend auto-approve

### Frontend not loading contract
- Check NEXT_PUBLIC_TRACK_VOTING_ADDRESS is set
- Verify contract is deployed
- Check wallet connected to Monad testnet

## 🔍 Testing Commands

```bash
# Compile
npx hardhat compile

# Deploy to Monad testnet
npx hardhat run scripts/deployTrackVoting.js --network monad

# Run tests (if you create test file)
npx hardhat test

# Verify contract (if explorer available)
npx hardhat verify --network monad <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Check services
./test-battle-system.sh
```

## 📚 API Reference

### Contract Methods

```solidity
// Write functions
function submitRemix(string calldata _remixURI) external
function vote(uint256 _remixId) external
function endVoting() external nonReentrant

// View functions
function getAllRemixes() external view returns (
    uint256[] memory ids,
    address[] memory remixers,
    string[] memory uris,
    uint256[] memory votes
)
function hasUserVoted(address _voter) external view returns (bool)
function getVoteCount(uint256 _remixId) external view returns (uint256)
function getVotingStatus() external view returns (
    bool active,
    bool distributed,
    address winnerAddress,
    uint256 winningId,
    uint256 prizeAmt
)

// Public variables
function host() external view returns (address)
function trackURI() external view returns (string)
function prizeAmount() external view returns (uint256)
function votingActive() external view returns (bool)
function winner() external view returns (address)
```

### Frontend Functions

```javascript
// Component: SingleTrackVoting.js

// Load track data
await loadTrackData(contractInstance)

// Load all remixes
await loadRemixes(contractInstance)

// Submit remix
await handleSubmitRemix()

// Vote for remix
await handleVote(remixId)

// End voting (host only)
await handleEndVoting()

// Setup event listeners
setupEventListeners(contractInstance)
```

## 🎯 Best Practices

1. **Always approve tokens before ending voting**
2. **Listen to contract events for real-time updates**
3. **Handle transaction errors gracefully**
4. **Show clear status messages to users**
5. **Disable buttons during transactions**
6. **Verify wallet is on correct network (Monad)**
7. **Cache vote counts for performance**
8. **Sort remixes by votes for better UX**

## 🚀 Production Checklist

- [ ] Deploy TrackVoting contract to Monad testnet
- [ ] Update frontend/.env.local with contract address
- [ ] Test submit remix flow
- [ ] Test voting flow
- [ ] Test end voting & prize distribution
- [ ] Verify real-time updates work
- [ ] Test error cases (double vote, host submit, etc.)
- [ ] Check gas costs are reasonable
- [ ] Verify prize tokens transfer correctly
- [ ] Test with multiple wallets

## 📖 Additional Resources

- **Monad Testnet RPC**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Prize Token**: 0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
- **Hardhat Config**: `hardhat.config.js`
- **Contract**: `contracts/TrackVoting.sol`
- **Frontend**: `frontend/components/SingleTrackVoting.js`

---

**✅ Production-ready single track voting system with automatic prize distribution on Monad testnet!**
