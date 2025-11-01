# Remix Battle System - Complete Guide

## Overview

The Remix Battle system is a fully on-chain competition platform where artists can host remix contests with prize pools. It leverages the Monad testnet for fast, low-cost transactions.

## Architecture

### Smart Contracts

1. **TestPrizeToken** (ERC-20)
   - Address: `0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5`
   - Symbol: PRIZE
   - Decimals: 18
   - Features: Public faucet (100 tokens/claim), owner mint function

2. **MusicNFT** (ERC-721)
   - Address: `0x21D652731fd29111714D60d99b641d52aF8D1251`
   - Manages track and remix NFTs

3. **VotingContract**
   - Address: `0x1dE4545be0a494716153F1Adb505F629905159C3`
   - Track voting with dynamic programming optimizations

4. **RemixBattle** (Main Contract)
   - Address: `0xDC642fC6f697E524Ac4d8EFADD80C459297aa4B2`
   - Handles battle lifecycle: creation → submission → voting → prize distribution

### Battle Lifecycle

```
1. CREATE BATTLE
   └─> Host approves PRIZE tokens
   └─> Host creates battle with trackURI + prizeAmount
   └─> Contract locks prize tokens

2. SUBMIT REMIXES
   └─> Artists submit remixURI to battle
   └─> Contract assigns submissionId
   └─> Host cannot submit to own battle

3. VOTING PHASE
   └─> Users vote for their favorite remix
   └─> One vote per address per battle
   └─> Votes are recorded on-chain

4. END BATTLE
   └─> Anyone can call endBattle when ready
   └─> Contract finds winner by highest votes
   └─> Prize tokens automatically transferred to winner
   └─> Winner declared on-chain
```

## Frontend Components

### 1. RemixBattlePage (Main UI)
- **Location**: `frontend/components/RemixBattlePage.js`
- **Features**:
  - Display all active and ended battles
  - Show user's PRIZE token balance
  - Faucet button to claim 100 PRIZE tokens
  - Create battle button
  - Grid layout with BattleCard components

### 2. BattleCard
- **Location**: `frontend/components/BattleCard.js`
- **Features**:
  - Battle status (Active/Ended)
  - Prize amount display
  - Submission count and total votes
  - Winner display (for ended battles)
  - Submit remix button (for participants)
  - Vote buttons (one vote per user)
  - End battle button (for hosts)
  - Leaderboard (sorted by votes)

### 3. CreateBattleModal
- **Location**: `frontend/components/CreateBattleModal.js`
- **Features**:
  - Track URI input
  - Prize amount input (in PRIZE tokens)
  - User balance display
  - Approval + creation in one flow

## Contract Functions

### Read Functions

```javascript
// Get battle details
const battle = await getBattleDetails(provider, battleId);
// Returns: { trackURI, host, prizeAmount, active, winnerAddress, submissions }

// Get all submissions for a battle
const submissions = await getBattleSubmissions(provider, battleId);
// Returns: [{ submissionId, remixer, remixURI, votes }, ...]

// Get leaderboard (sorted by votes)
const leaderboard = await getBattleLeaderboard(provider, battleId);
// Returns: [{ submissionId, remixer, remixURI, votes }, ...] (sorted)

// Check if user has voted
const voted = await hasVoted(provider, battleId, userAddress);
// Returns: boolean

// Get PRIZE token balance
const balance = await getPrizeTokenBalance(provider, userAddress);
// Returns: BigInt (wei)
```

### Write Functions

```javascript
// Create a battle
const battleId = await createBattle(signer, trackURI, prizeAmount);
// Approves tokens + creates battle, returns battleId

// Submit a remix
const submissionId = await submitRemix(signer, battleId, remixURI);
// Returns: submissionId

// Vote for a remix
await voteForRemix(signer, battleId, submissionId);

// End battle and distribute prize
await endBattle(signer, battleId);

// Claim faucet tokens (100 PRIZE)
await claimFaucetTokens(signer);
```

## Getting Started

### 1. Get Test Tokens

```bash
# Navigate to Remix Battles tab
# Click "Claim 100 PRIZE" button
# Approve MetaMask transaction
# Tokens will appear in your balance
```

### 2. Create a Battle

```bash
# Click "Create Battle" button
# Enter track URI (e.g., ipfs://... or http://...)
# Enter prize amount (e.g., 50 for 50 PRIZE tokens)
# Click "Create Battle"
# Approve token spending (first time)
# Confirm battle creation
```

### 3. Submit a Remix

```bash
# Find a battle in the Active section
# Click "Submit Remix"
# Enter your remix URI
# Click "Submit"
# Confirm transaction
```

### 4. Vote

```bash
# Expand a battle to see submissions
# Click "Vote" on your favorite remix
# Confirm transaction
# Vote is recorded (can't vote again)
```

### 5. End Battle & Claim Prize

```bash
# As the battle host:
# Click "End Battle" when ready
# Contract automatically:
#   - Tallies votes
#   - Finds winner
#   - Transfers prize to winner
# Winner declared on-chain
```

## Technical Details

### Gas Optimization

- Uses `ReentrancyGuard` to prevent reentrancy attacks
- Battle IDs are sequential (cheaper than random)
- Prize tokens locked at creation (no additional approval needed)
- Winner calculation in O(n) time

### Events Emitted

```solidity
event BattleCreated(uint256 indexed battleId, address indexed host, string trackURI, uint256 prizeAmount);
event RemixSubmitted(uint256 indexed battleId, uint256 submissionId, address indexed remixer, string remixURI);
event VoteCast(uint256 indexed battleId, uint256 indexed submissionId, address indexed voter);
event BattleEnded(uint256 indexed battleId, address indexed winner, uint256 prizeAmount);
event PrizeDistributed(uint256 indexed battleId, address indexed winner, uint256 amount);
```

### Security Features

- Host cannot submit to own battle
- One vote per address per battle
- Prize locked until battle ends
- Winner automatically determined
- No manual prize distribution needed

## Environment Variables

```bash
NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
NEXT_PUBLIC_REMIX_BATTLE_ADDRESS=0xDC642fC6f697E524Ac4d8EFADD80C459297aa4B2
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
```

## Troubleshooting

### "Insufficient allowance"
- You need to approve PRIZE tokens before creating a battle
- The app automatically handles this with the approve + create flow

### "Already voted"
- You can only vote once per battle
- Check the battle card - it will show "Already voted"

### "Battle not active"
- Battle has already ended
- Check the winner section to see results

### "Host cannot submit remix"
- Battle hosts cannot participate in their own battles
- This is a security measure

## Testing Commands

```bash
# Compile contracts
npx hardhat compile

# Deploy to Monad testnet
npx hardhat run scripts/deployBattle.js --network monad

# Run local tests
npx hardhat test

# Start frontend
cd frontend && npm run dev

# Start backend (for track storage)
cd backend && node server.js
```

## Next Steps

1. ✅ Deploy contracts to Monad testnet
2. ✅ Create frontend components
3. ✅ Add navigation to battles page
4. 🔲 Add toast notifications for transactions
5. 🔲 Integrate with existing track upload system
6. 🔲 Add battle analytics dashboard
7. 🔲 Implement battle discovery/search
8. 🔲 Add social sharing features

## Resources

- **Monad Testnet**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Block Explorer**: Coming soon
- **Faucet**: Built into app (claimFaucetTokens)

## Support

For issues or questions:
1. Check contract events in console
2. Verify wallet is connected to Monad testnet
3. Ensure sufficient PRIZE token balance
4. Check browser console for error messages
