# 🎵 Running the Music NFT Platform

## ⚠️ CRITICAL: 3 Services Must Run Simultaneously

This platform requires **3 services** running at the same time:

1. **Hardhat Node** (Blockchain) → Port 8545
2. **Backend Server** (File Storage) → Port 3002
3. **Frontend** (UI) → Port 3001

**If ANY service stops, you'll get "Failed to fetch" errors!**

---

## 🚀 STEP-BY-STEP STARTUP

### Terminal 1: Start Blockchain (Hardhat Node)

```bash
cd /home/yuvrajs/Desktop/MonadFInal
npx hardhat node
```

**✅ Wait for:** `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/`

**⚠️ KEEP THIS RUNNING! Don't close this terminal.**

---

### Terminal 2: Deploy Contracts (One-time)

**Wait for Terminal 1 to be ready**, then in a NEW terminal:

```bash
cd /home/yuvrajs/Desktop/MonadFInal
npx hardhat run scripts/deploy.js --network localhost
```

**✅ You'll see:**
```
MusicNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
VotingContract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

These addresses are already configured. Close this terminal after success.

---

### Terminal 3: Start Backend Server

```bash
cd /home/yuvrajs/Desktop/MonadFInal/backend
node server.js
```

**✅ You'll see:** `Backend server running on http://localhost:3002`

**⚠️ KEEP THIS RUNNING!**

---

### Terminal 4: Start Frontend

```bash
cd /home/yuvrajs/Desktop/MonadFInal/frontend
npm run dev
```

**✅ You'll see:** `Local: http://localhost:3001`

**⚠️ KEEP THIS RUNNING!**

Open browser: **http://localhost:3001**

## 🦊 MetaMask Setup

### 1. Add Localhost Network

- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `1337`
- Currency: `ETH`

### 2. Import Test Account

Private Key:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This account has **10,000 ETH** for testing.

---

## ❌ Troubleshooting Errors

### "Failed to fetch" Error
**Cause:** Hardhat node (Terminal 1) not running  
**Fix:** Start Terminal 1 and wait for "Started HTTP..." message

### "Cannot connect to backend"
**Cause:** Backend server (Terminal 3) not running  
**Fix:** Start Terminal 3 with `node server.js`

### "Contracts not configured"
**Cause:** Contracts not deployed  
**Fix:** Run Terminal 2 deployment command

### MetaMask "Wrong Network"
**Fix:** Switch MetaMask to "Hardhat Local" network

---

## ✅ Health Checks

Test if services are running:

```bash
# Test blockchain (should return block number)
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8545

# Test backend (should return "OK")
curl http://localhost:3002/health

# Test frontend (should return HTML)
curl http://localhost:3001
```

## Current Project Status

- ✅ Smart contracts implemented with dynamic programming optimizations
- ✅ NFT minting for tracks and remixes
- ✅ Voting system with memoization
- ✅ IPFS integration utilities
- ✅ Frontend UI with wallet integration
- ✅ Real-time voting interface
- ✅ Competition countdown timer
- ✅ Tests and deployment scripts
- ⚠️  Frontend dependencies need installation
- ⚠️  2 timing-sensitive tests need Hardhat time manipulation

## Quick Test Run

```bash
# Run all tests
npm test

# Compile contracts
npm run compile
```

