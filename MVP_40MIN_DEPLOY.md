# 🚀 MVP 40-Minute Deployment Guide

**Time-Sensitive Track Voting with Automatic Prize Distribution**

This guide will help you deploy and demo the complete MVP system in 40 minutes or less.

---

## ⏱️ Timeline Breakdown

- **0-5 min**: Deploy contracts
- **5-10 min**: Configure frontend
- **10-15 min**: Start application
- **15-40 min**: Demo complete flow (submit, vote, distribute prize)

---

## 🎯 What You'll Deploy

A single-page voting system where:
1. **Host** uploads track and sets prize pool
2. **Remixers** submit their remixes
3. **Users** vote (one vote per wallet)
4. **Host** ends voting → **Winner receives prize automatically!**

---

## 📋 Prerequisites (5 minutes)

### 1. Environment Variables

Create `.env` in project root:

```bash
PRIVATE_KEY=your_private_key_here
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

### 2. Get MON Tokens

If you need test tokens:
```bash
npx hardhat run scripts/getMON.js --network monad
```

This will call the TestPrizeToken faucet to get 100 MON tokens.

---

## 🚀 Step 1: Deploy (5 minutes)

### Option A: Quick Deploy (Recommended)

Edit `scripts/deployMVP.js` configuration:

```javascript
const CONFIG = {
  HOST: '0xYourHostAddressHere',
  TRACK_URI: 'ipfs://QmYourTrack',
  PRIZE_TOKEN: '0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5', // TestPrizeToken
  PRIZE_AMOUNT: '10' // 10 MON tokens
};
```

Then deploy:

```bash
npx hardhat run scripts/deployMVP.js --network monad
```

**Expected Output:**
```
🚀 MVP DEPLOYMENT STARTED
========================================
✅ TrackVoting deployed at: 0xYourNewAddress
⏱️  Ready for 40-minute demo!
```

### Option B: Manual Deploy

```bash
npx hardhat run scripts/deployTrackVoting.js --network monad
```

---

## ⚙️ Step 2: Configure Frontend (5 minutes)

Create/update `frontend/.env.local`:

```bash
# Copy the contract address from deployment output
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0xYourDeployedAddress

# Prize token (already deployed)
NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5

# Monad Testnet
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143

# Backend-only mode (optional)
NEXT_PUBLIC_BACKEND_ONLY=true
```

---

## 🎬 Step 3: Start Application (5 minutes)

### Terminal 1: Backend (Optional - only if using file uploads)

```bash
cd backend
npm install
npm start
```

Expected: `Server running on port 3002`

### Terminal 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

Expected: `Ready on http://localhost:3001`

---

## 🎮 Step 4: Demo Flow (25 minutes)

### Phase 1: Initial Setup (5 min)

1. **Open Application**
   - Navigate to: `http://localhost:3001`
   - Click **🗳️ Track Voting** tab

2. **Verify Track Info**
   - Check host address matches yours
   - Confirm prize amount (10 MON)
   - Status should show: 🟢 ACTIVE

### Phase 2: Submit Remixes (5 min)

**As Remixer (Use different wallet):**

1. Click **📤 Submit Your Remix**
2. Enter remix URI: `ipfs://QmExampleRemix1`
3. Click **Submit**
4. Wait for confirmation: ✅ Remix #1 submitted successfully!

**Repeat with 2-3 different wallets** to create competition:
- Remix #1: `ipfs://QmRemix1`
- Remix #2: `ipfs://QmRemix2`
- Remix #3: `ipfs://QmRemix3`

### Phase 3: Voting (10 min)

**As Different Users:**

1. Switch to voter wallet (not host, not remixer)
2. See list of all remixes with vote counts
3. Click **🗳️ Vote for This Remix** on your favorite
4. Confirm transaction
5. See: ✅ Your vote for Remix #X recorded!
6. Your vote is marked with green ✓ YOUR VOTE badge

**Get 5-10 friends/wallets to vote** for different remixes

### Phase 4: End & Distribute Prize (5 min)

**As Host:**

1. In **Host Controls** section, you'll see:
   - ⚠️ Warning to approve tokens
   - Yellow **Approve 10 MON** button

2. Click **Approve 10 MON**
   - Confirm transaction
   - Wait for: ✅ Tokens approved!

3. Click **🏁 End Voting & Distribute Prize**
   - Transaction pending message appears
   - Wait 30-60 seconds...

4. **Victory! 🏆**
   - Winner banner appears with trophy
   - Shows winning remix ID and address
   - Shows: ✅ 10 MON tokens sent!
   - Status changes to 🔴 ENDED + 💰 PAID

### Phase 5: Verification (Optional)

**Check Winner's Balance:**

```bash
npx hardhat console --network monad
```

```javascript
const token = await ethers.getContractAt(
  'TestPrizeToken',
  '0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5'
);
const balance = await token.balanceOf('0xWinnerAddress');
console.log(ethers.formatEther(balance)); // Should show +10 MON
```

---

## 🎯 Expected Results

### Visual Indicators

✅ **During Voting:**
- Green 🟢 ACTIVE badge
- Vote counts update in real-time
- Voted remixes show ✓ YOUR VOTE
- Leaderboard sorted by votes (🥇🥈🥉)

✅ **After Ending:**
- Red 🔴 ENDED badge
- Yellow 💰 PAID badge
- Gold winner banner with 🏆
- Winner address and prize amount displayed
- No more voting buttons

### Transaction Flow

1. `RemixSubmitted` events → Remix appears instantly
2. `VoteCast` events → Vote count updates immediately
3. `VotingEnded` event → Winner announced
4. `PrizeDistributed` event → Prize sent in same transaction!

---

## 🐛 Troubleshooting

### "Only host can end"
- Make sure you're using the correct wallet (HOST address)
- Check MetaMask is connected to right account

### "Approve Tokens First"
- Click the yellow **Approve 10 MON** button
- Wait for approval transaction to complete

### "Insufficient allowance"
- Your balance is too low
- Run faucet: `npx hardhat run scripts/getMON.js --network monad`

### "No remixes submitted"
- Need at least 1 remix to end voting
- Have someone submit a remix first

### Votes Not Updating
- Check browser console for errors
- Verify contract address in `.env.local`
- Refresh page to re-establish event listeners

---

## 📊 Key Metrics

**Gas Costs (Approximate):**
- Deploy TrackVoting: ~1.2M gas
- Submit remix: ~100k gas
- Vote: ~80k gas
- End voting: ~150k gas (includes prize transfer!)
- Approve tokens: ~50k gas

**Performance:**
- Event updates: < 1 second
- Transaction confirmations: 30-60 seconds
- Full demo cycle: 15-25 minutes

---

## 🎓 Demo Script

Use this script for presentations:

> "I'll show you our decentralized remix voting system with automatic prize distribution.
>
> 1. **[Show track info]** Here's the track, hosted by me, with a 10 MON prize pool.
>
> 2. **[Submit remixes]** Three remixers have submitted their work. Each gets a unique ID.
>
> 3. **[Cast votes]** Fans are voting - watch the counts update in real-time! Notice the leaderboard.
>
> 4. **[Approve tokens]** As host, I approve the contract to spend the prize.
>
> 5. **[End voting]** Now I end the voting. In ONE transaction, the system:
>    - Identifies the winner (most votes)
>    - Transfers the prize automatically
>    - Updates the UI
>
> 6. **[Show winner]** 🏆 Winner announced! They received 10 MON tokens instantly!"

---

## 🔐 Security Notes

- **ReentrancyGuard** prevents double prize distribution
- **Host cannot vote** to avoid conflicts of interest
- **Host cannot submit** to maintain neutrality
- **One vote per wallet** ensures fairness
- **Allowance check** prevents unauthorized token transfers
- **Vote caching** provides O(1) winner selection

---

## 📦 Next Steps

After successful 40-minute demo:

1. **Deploy to production** with real token
2. **Add IPFS integration** for actual audio files
3. **Implement frontend file uploads** via backend
4. **Add user profiles** and history
5. **Scale to multiple tracks** simultaneously

---

## 🎉 Success Checklist

- [ ] Contracts deployed to Monad testnet
- [ ] Frontend showing track details
- [ ] Multiple remixes submitted
- [ ] Votes cast by different users
- [ ] Host approved tokens
- [ ] Voting ended successfully
- [ ] Winner received prize automatically
- [ ] All events displayed correctly
- [ ] Demo completed in < 40 minutes

---

## 🆘 Quick Commands Reference

```bash
# Deploy MVP
npx hardhat run scripts/deployMVP.js --network monad

# Get test tokens
npx hardhat run scripts/getMON.js --network monad

# Run tests
npx hardhat test test/TrackVoting.test.js

# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Check contract on explorer
# https://testnet.monadexplorer.com/address/YOUR_ADDRESS
```

---

## 📞 Support

- **Tests:** 33 passing tests in `test/TrackVoting.test.js`
- **Documentation:** See `TRACK_VOTING_GUIDE.md` for detailed info
- **Contract Code:** `contracts/TrackVoting.sol`
- **Frontend Component:** `frontend/components/MVPTrackVoting.js`

---

**⏱️ You're ready to ship in 40 minutes! 🚀**
