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

## To Deploy Contracts

1. **Set up `.env` file in root**:
```bash
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=your_private_key_here
```

2. **Deploy**:
```bash
npm run compile
npx hardhat run scripts/deploy.js --network monad
```

3. **Copy contract addresses** to `frontend/.env.local`

4. **Fund the voting contract** with prize money:
```bash
# Send MON tokens to the voting contract address
```

5. **Create a competition**:
```bash
npx hardhat run scripts/createCompetition.js --network monad <trackId> <durationSeconds> <prizeAmountInETH>
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

