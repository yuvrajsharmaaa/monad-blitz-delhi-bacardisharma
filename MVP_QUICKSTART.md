# MVP Quick Start - Single Track Voting

## 🎯 Objective

Build a fully working MVP where everything happens on **ONE track page**:
- Original track display
- Remix submissions
- On-chain voting
- Automatic prize distribution

## 🚀 15-Minute Setup

### Step 1: Prerequisites Check

```bash
# Verify installations
node --version  # Should be 18+
npm --version

# Verify MetaMask installed in browser
# Get Monad testnet ETH (for gas)
```

### Step 2: Clone & Install

```bash
git clone <your-repo>
cd MonadFInal

# Install all dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### Step 3: Configure Environment

```bash
# Root .env (for deployment)
echo "MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=your_private_key_here" > .env

# Frontend .env.local (already configured)
# Check frontend/.env.local has:
# NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0x7637801a09823b8AF38c0029DAe381EA4c31668b
# NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
```

### Step 4: Start Services

```bash
# Terminal 1 - Frontend
cd frontend && npm run dev
# Runs on http://localhost:3001

# Terminal 2 - Backend (optional for file storage)
cd backend && node server.js
# Runs on http://localhost:3002
```

### Step 5: Test MVP

```bash
# Open browser
http://localhost:3001

# Navigate to Track Voting
Click "🗳️ Track Voting" tab

# Connect wallet
MetaMask → Connect → Switch to Monad Testnet

# Get test tokens
Click "Claim 100 PRIZE" (faucet)

# Test flow:
1. Submit remix → Enter URI → Confirm
2. Vote → Click vote button → Confirm
3. End voting (if host) → Confirm
4. See winner + prize transfer! 🎉
```

## 📱 MVP User Flow

### For Host (Track Uploader)

```
1. Deploy TrackVoting contract
   → npx hardhat run scripts/deployTrackVoting.js --network monad
   → Copy address to frontend/.env.local

2. Get MON tokens
   → Use faucet: Click "Claim 100 PRIZE"

3. Navigate to Track Voting page
   → Track info automatically displayed

4. Watch submissions come in
   → Real-time updates

5. When ready, end voting
   → Click "End Voting & Distribute Prize"
   → Approve tokens (auto-prompted)
   → Winner announced + prize sent!
```

### For Remixers

```
1. Navigate to Track Voting page
   → See original track

2. Submit your remix
   → Click "Submit Remix"
   → Enter URI (ipfs://... or http://...)
   → Confirm transaction

3. Wait for votes
   → Watch vote count update live

4. If you win
   → Prize automatically sent to your wallet!
```

### For Voters

```
1. Browse remixes on track page
   → See all submissions with vote counts

2. Vote for favorite
   → Click "Vote" button
   → Confirm transaction
   → One vote per wallet

3. Watch results
   → Live updates as voting progresses
   → Winner announced when host ends voting
```

## 🔧 Deploy Your Own Track

```bash
# 1. Edit deployment script (optional)
nano scripts/deployTrackVoting.js
# Change TRACK_URI, PRIZE_AMOUNT if needed

# 2. Deploy to Monad testnet
npx hardhat run scripts/deployTrackVoting.js --network monad

# 3. Copy output address
# Example output:
# ✓ TrackVoting deployed to: 0xYourAddress

# 4. Update frontend config
nano frontend/.env.local
# Set: NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0xYourAddress

# 5. Restart frontend
cd frontend && npm run dev

# 6. Your track is live!
```

## 🧪 Testing

```bash
# Run full test suite
npx hardhat test test/TrackVoting.test.js

# Expected: 33 passing tests ✅

# Test coverage includes:
- Remix submission
- Voting (single vote enforcement)
- End voting logic
- Prize distribution
- Edge cases
- Security checks
```

## 📊 MVP Features Checklist

### Smart Contract ✅
- [x] Single contract per track
- [x] Remix submissions
- [x] One vote per wallet
- [x] Automatic winner selection
- [x] Automatic prize transfer
- [x] Host-only ending
- [x] ReentrancyGuard
- [x] Vote caching
- [x] Events for frontend

### Frontend ✅
- [x] Single page for everything
- [x] Track info display
- [x] Remix submission form
- [x] Vote buttons
- [x] Live vote counts
- [x] End voting button (host only)
- [x] Winner display
- [x] Real-time updates
- [x] Transaction feedback
- [x] Wallet connection

### Testing ✅
- [x] 33 comprehensive tests
- [x] All flows covered
- [x] Edge cases tested
- [x] Security verified

### Documentation ✅
- [x] README
- [x] Deployment guide
- [x] API reference
- [x] User guide
- [x] Troubleshooting

## 🎊 What Works Right Now

1. **Deploy Contract** → `npx hardhat run scripts/deployTrackVoting.js --network monad`
2. **Submit Remixes** → Click form, enter URI, confirm
3. **Vote On-Chain** → Click vote button, one per wallet
4. **End & Distribute** → Host clicks, winner gets prize automatically
5. **Real-Time Updates** → Events refresh UI instantly

## 🐛 Common Issues & Fixes

### Issue: "Contract address not configured"
**Fix**: Update `frontend/.env.local` with deployed address

### Issue: "Insufficient allowance"
**Fix**: Frontend auto-handles this, just confirm approval transaction

### Issue: "Already voted"
**Fix**: Expected - one vote per wallet per track

### Issue: "Host cannot submit remix"
**Fix**: Expected - use different wallet for remixing

### Issue: Frontend not connecting
**Fix**: Check MetaMask on Monad testnet (Chain ID 10143)

## 📚 Key Files

| File | Purpose |
|------|---------|
| `contracts/TrackVoting.sol` | Main voting contract |
| `frontend/components/SingleTrackVoting.js` | Complete UI |
| `scripts/deployTrackVoting.js` | Deployment script |
| `test/TrackVoting.test.js` | 33 tests |
| `frontend/.env.local` | Contract addresses |

## 🎯 Next Steps

### Immediate (MVP is ready!)
- [x] Contract deployed
- [x] Frontend working
- [x] Tests passing
- [x] Documentation complete

### Optional Enhancements
- [ ] Add audio player for tracks/remixes
- [ ] IPFS pinning integration
- [ ] Time-limited voting
- [ ] Multiple prize tiers
- [ ] Social sharing
- [ ] Battle analytics

## 🌟 MVP Success Criteria

✅ **Can submit remix on single page**
✅ **Can vote on-chain with one click**
✅ **Can see live vote counts**
✅ **Host can end voting**
✅ **Winner gets prize automatically**
✅ **All on ONE page - no navigation**

## 🚀 You're Ready!

The MVP is **fully functional** and deployed to Monad testnet:

**Contract**: `0x7637801a09823b8AF38c0029DAe381EA4c31668b`
**Frontend**: `http://localhost:3001` → "🗳️ Track Voting"
**Tests**: `33 passing` ✅

---

**🎉 Start voting and distributing prizes on your single track page now!**
