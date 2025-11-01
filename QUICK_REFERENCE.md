# 🎯 MVP Quick Reference Card

**⏱️ 40-Minute Track Voting System**

---

## 🚀 Deploy (5 min)

```bash
# 1. Edit config in scripts/deployMVP.js
# 2. Run deployment
npx hardhat run scripts/deployMVP.js --network monad

# 3. Copy address to frontend/.env.local
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0xYourAddress
```

---

## 🎬 Start (5 min)

```bash
# Frontend
cd frontend && npm run dev

# Visit: http://localhost:3001
# Click: 🗳️ Track Voting
```

---

## 🎮 Demo Flow (30 min)

### Phase 1: Submit Remixes (10 min)
- Switch to remixer wallet
- Click "📤 Submit Your Remix"
- Enter URI: `ipfs://QmRemix1`
- Repeat with 2-3 wallets

### Phase 2: Vote (10 min)
- Switch to voter wallets
- Click "🗳️ Vote for This Remix"
- Get 5-10 votes across remixes

### Phase 3: End & Pay (10 min)
- Switch to host wallet
- Click "Approve 10 MON" (wait 30s)
- Click "🏁 End Voting & Distribute Prize" (wait 30s)
- 🏆 Winner banner appears!
- ✅ Prize sent automatically!

---

## 🔑 Key Addresses

```
Prize Token:  0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
Track Voting: [Your deployed address]
Network:      Monad Testnet (Chain ID 10143)
RPC:          https://testnet-rpc.monad.xyz
```

---

## 🆘 Quick Fixes

**Need tokens?**
```bash
npx hardhat run scripts/getMON.js --network monad
```

**Wrong network?**
- MetaMask → Networks → Add Monad Testnet
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz

**Can't end voting?**
- Approve tokens first (yellow button)
- Make sure you're the host
- Need at least 1 remix submitted

---

## ✅ Success Checklist

- [ ] Contract deployed
- [ ] Frontend showing track info
- [ ] 3+ remixes submitted
- [ ] 5+ votes cast
- [ ] Host approved tokens
- [ ] Voting ended
- [ ] Winner got prize
- [ ] Done in < 40 minutes!

---

## 📁 Key Files

- Contract: `contracts/TrackVoting.sol`
- Deploy: `scripts/deployMVP.js`
- Frontend: `frontend/components/MVPTrackVoting.js`
- Guide: `MVP_40MIN_DEPLOY.md`
- Tests: `test/TrackVoting.test.js` (33 ✅)

---

## 🎉 Visual Indicators

**Active Voting:**
- 🟢 ACTIVE badge
- Vote buttons visible
- Leaderboard with 🥇🥈🥉

**Ended:**
- 🔴 ENDED badge
- 🏆 Winner banner
- 💰 PAID badge
- No vote buttons

---

**Full docs: See `MVP_40MIN_DEPLOY.md`**
