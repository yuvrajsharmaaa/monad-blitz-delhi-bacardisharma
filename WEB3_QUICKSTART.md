# ⚡ Web3 Quick Start - 3 Commands

Transform to full Web3 in 3 steps:

---

## 🚀 Option 1: Automatic (Recommended)

```bash
# Run the enabler script
./enable-web3.sh

# Restart frontend
cd frontend && npm run dev
```

**Done! Backend-only banner is gone, Web3 enabled.** ✅

---

## 🔧 Option 2: Manual

### Step 1: Edit Config
```bash
# Open frontend/.env.local
# Change this line:
NEXT_PUBLIC_BACKEND_ONLY=false
```

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Verify
- Open http://localhost:3001
- Banner "Backend-only mode" should be GONE
- Connect MetaMask
- Go to Track Voting tab

---

## 🧪 Test Full Web3 Flow

### 1. Fund Wallet
```bash
npx hardhat run scripts/getMON.js --network monad
```

### 2. Add Monad to MetaMask
```
Network: Monad Testnet
RPC: https://testnet-rpc.monad.xyz
Chain ID: 10143
```

### 3. Test Voting
1. **Submit Remix** → MetaMask popup → Confirm → Wait 30s
2. **Vote** → MetaMask popup → Confirm → See count update
3. **Approve Tokens** (host) → MetaMask popup → Confirm
4. **End Voting** (host) → MetaMask popup → Confirm
5. **Victory Panel** appears with winner data! 🏆

---

## ✅ Verification

Web3 is working if:
- ✅ No "Backend-only mode" banner
- ✅ MetaMask popup on actions
- ✅ Vote counts update after tx confirms
- ✅ Victory panel shows on end
- ✅ Transaction hash is clickable
- ✅ Winner receives MON tokens

---

## 🐛 Quick Fixes

### "Failed to fetch"
```bash
# Check .env.local
grep BACKEND_ONLY frontend/.env.local
# Should show: NEXT_PUBLIC_BACKEND_ONLY=false

# Restart
cd frontend && npm run dev
```

### "Network not supported"
- MetaMask → Switch to Monad Testnet (Chain ID 10143)
- Refresh page

### "Insufficient allowance"
- Host clicks "Approve Prize Tokens" FIRST
- Wait for confirmation
- Then click "End Voting"

### No MetaMask popup
- Click MetaMask extension icon
- Check for hidden approval window
- Disable popup blocker

---

## 📚 Full Documentation

- **WEB3_SETUP_GUIDE.md** - Complete setup (5 min read)
- **EVENT_HANDLING_GUIDE.md** - Event system details
- **MVP_40MIN_DEPLOY.md** - Fresh deployment guide
- **TROUBLESHOOTING.md** - Common issues

---

## 🎯 Key Addresses

```bash
# Already deployed and ready to use:
TrackVoting:  0x7637801a09823b8AF38c0029DAe381EA4c31668b
Prize Token:  0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
RemixBattle:  0xDC642fC6f697E524Ac4d8EFADD80C459297aa4B2

# Monad Testnet:
RPC:     https://testnet-rpc.monad.xyz
Chain:   10143
Explorer: https://testnet.monadexplorer.com
```

---

## 🎉 Ready!

**Your app is now fully Web3-enabled on Monad testnet!**

All voting, prizes, and rewards are on-chain. 🚀
