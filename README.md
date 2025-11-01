# Music Remix Competition Platform on Monad

A full-stack decentralized platform for music remix competitions built on the Monad blockchain with on-chain voting, prize pools, and automatic winner determination.

## 🎯 Features

### Core Functionality
- ✅ **NFT minting** for original tracks and remixes
- ✅ **On-chain voting** with dynamic programming/memoization optimizations
- ✅ **Remix Battles** with ERC-20 prize pools
- ✅ **Automatic prize distribution** to winners
- ✅ **Real-time leaderboards** with vote tracking
- ✅ **Backend storage** option for rapid prototyping
- ✅ **IPFS integration** for decentralized metadata

### Smart Contract Features
- 🏆 **RemixBattle system** with create, submit, vote, end functions
- 💰 **TestPrizeToken** (ERC-20) with public faucet
- 🔒 **ReentrancyGuard** security on sensitive functions
- ⚡ **Gas-optimized** for Monad's parallel execution
- 📊 **Automatic winner calculation** and prize transfer

### UI Features
- 🎨 **Responsive design** with Tailwind CSS
- 🎵 **Audio player** for track preview
- 🏅 **Leaderboard** with medals (🥇🥈🥉)
- 💾 **Backend-only mode** (no wallet required for testing)
- 🔗 **MetaMask integration** with auto-network switching

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity 0.8.24, OpenZeppelin, Hardhat
- **Frontend**: Next.js 14.2.33, React 18, ethers.js 6, Tailwind CSS
- **Backend**: Express.js with multer for file uploads
- **Storage**: Backend filesystem + optional IPFS
- **Blockchain**: Monad Testnet (Chain ID: 10143)
- **Testing**: Mocha, Chai

## 🚀 Deployed Contracts (Monad Testnet)

### Remix Battle System (Multi-Battle Platform)
```
PRIZE Token:     0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
RemixBattle:     0xDC642fC6f697E524Ac4d8EFADD80C459297aa4B2
MusicNFT:        0x21D652731fd29111714D60d99b641d52aF8D1251
VotingContract:  0x1dE4545be0a494716153F1Adb505F629905159C3
```

### Track Voting System (Single-Track Focus)
```
TrackVoting:     0x7637801a09823b8AF38c0029DAe381EA4c31668b
Prize Token:     0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5 (same)
```

**Network Details:**
- RPC: `https://testnet-rpc.monad.xyz`
- Chain ID: `10143`
- Network Name: `Monad Testnet`

## Architecture

### Dynamic Programming Optimizations

1. **On-Chain Memoization**: Vote counts cached in `voteCache` mapping to avoid recomputation
2. **Incremental Updates**: Votes update cache directly instead of full state scan
3. **Frontend Caching**: Event listeners cache vote data to minimize RPC calls
4. **Optimized Storage**: Only store essential data (IDs, IPFS hashes) on-chain

### Smart Contracts

- **MusicNFT.sol**: ERC721 contract for minting original tracks and remixes
- **VotingContract.sol**: Voting system with `tallyVotes()` using memoization and `declareWinner()` using cached results

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd MonadFInal

# Install dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..

# Backend dependencies
cd backend
npm install
cd ..
```

### Run the Application

**Option 1: Use the helper script (recommended)**
```bash
./start-dev.sh
```

**Option 2: Manual start**
```bash
# Terminal 1 - Frontend (http://localhost:3001)
cd frontend && npm run dev

# Terminal 2 - Backend (http://localhost:3002)
cd backend && node server.js
```

### Access the App

1. Open http://localhost:3001
2. Click **🏆 Remix Battles** tab
3. Connect MetaMask to Monad testnet (auto-configured)
4. Click **Claim 100 PRIZE** to get test tokens
5. Create a battle and start competing!

## 🎮 How to Use

### 1. Get Test Tokens
- Navigate to **Remix Battles** tab
- Click **Claim 100 PRIZE** button
- Confirm transaction in MetaMask

### 2. Create a Battle
- Click **Create Battle**
- Enter track URI (e.g., `ipfs://...` or `http://...`)
- Enter prize amount (e.g., `50` for 50 PRIZE tokens)
- Approve token spending (first time only)
- Confirm battle creation

### 3. Submit a Remix
- Find an active battle
- Click **Submit Remix**
- Enter your remix URI
- Confirm transaction

### 4. Vote
- Expand a battle to see submissions
- Click **Vote** on your favorite
- Confirm transaction
- Only one vote per address per battle!

### 5. End Battle & Claim Prize
- Battle host clicks **End Battle**
- Contract automatically:
  - Tallies votes
  - Finds winner
  - Transfers prize to winner
- Winner declared on-chain!

## 🔧 Development

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Monad Testnet
```bash
# Deploy all contracts (RemixBattle + PrizeToken + MusicNFT + Voting)
npx hardhat run scripts/deployBattle.js --network monad

# Update frontend/.env.local with deployed addresses
```

### Run Tests
```bash
npx hardhat test
```

### Check Services Status
```bash
./test-battle-system.sh
```

## 📁 Project Structure

```
├── contracts/
│   ├── MusicNFT.sol           # NFT minting contract
│   ├── VotingContract.sol     # Voting with dynamic programming
│   ├── RemixBattle.sol        # 🏆 Battle system with prizes
│   └── TestPrizeToken.sol     # ERC-20 token with faucet
├── frontend/
│   ├── app/
│   │   ├── page.js            # Main page with tabs
│   │   ├── tracks/page.js     # Tracks listing
│   │   └── battles/page.js    # 🏆 Battles page
│   ├── components/
│   │   ├── RemixBattlePage.js # Battle arena UI
│   │   ├── BattleCard.js      # Individual battle display
│   │   ├── CreateBattleModal.js # Battle creation form
│   │   ├── TrackCard.js       # Track with remixes
│   │   └── ... (more components)
│   ├── hooks/
│   │   └── useWallet.js       # Wallet connection hook
│   └── utils/
│       ├── contracts.js       # Contract ABIs
│       ├── remixBattle.js     # 🏆 Battle utils
│       └── ipfs.js            # IPFS/backend integration
├── backend/
│   ├── server.js              # Express server
│   ├── uploads/               # Audio files storage
│   └── data/tracks.json       # Track metadata
├── scripts/
│   ├── deploy.js              # Original deployment
│   ├── deployBattle.js        # 🏆 Battle system deployment
│   └── createCompetition.js   # Competition creation
├── test/
│   ├── MusicNFT.test.js       # NFT tests
│   └── VotingContract.test.js # Voting tests
└── hardhat.config.js          # Hardhat config
```

## Testing

```bash
# Run all tests
npm test

# Run specific test
npx hardhat test test/VotingContract.test.js
```

## 🎯 Key Features Explained

### Remix Battle System

The **RemixBattle** contract implements a complete competition lifecycle:

```solidity
// 1. Create battle (locks prize tokens)
function createBattle(string memory trackURI, uint256 prizeAmount)

// 2. Submit remixes (excludes host)
function submitRemix(uint256 battleId, string memory remixURI)

// 3. Vote (one vote per address)
function voteRemix(uint256 battleId, uint256 submissionId)

// 4. End battle (automatic prize distribution)
function endBattle(uint256 battleId)

// 5. Get leaderboard (sorted by votes)
function getBattleLeaderboard(uint256 battleId)
```

**Security Features:**
- `ReentrancyGuard` on sensitive functions
- Host cannot submit to own battle
- Prize locked until battle ends
- Automatic winner determination

### Dynamic Programming in Voting

The `VotingContract` uses memoization to cache vote counts:

```solidity
// Cache vote counts to avoid recomputation
mapping(uint256 => mapping(uint256 => uint256)) public voteCache;

function vote(...) {
    // Incremental update to cache
    voteCache[originalTrackId][remixId] = currentVotes + 1;
}

function tallyVotes(...) {
    // Use cached values instead of recalculating
    return voteCache[originalTrackId][remixId];
}
```

### Backend-Only Mode

Toggle between Web3 and traditional backend:

- **Backend-Only** (`NEXT_PUBLIC_BACKEND_ONLY=true`):
  - No wallet required
  - Fast local storage
  - Great for prototyping
  
- **Web3 Mode** (`NEXT_PUBLIC_BACKEND_ONLY=false`):
  - Full blockchain integration
  - NFT minting
  - On-chain voting
  - Prize distribution

### Monad Optimizations

- Minimal on-chain storage (only IDs and hashes)
- Incremental state updates
- Event-driven architecture
- Gas-optimized for parallel execution
- Fast transactions (~400ms on Monad testnet)

## 📚 Documentation

- **[BATTLE_SYSTEM_COMPLETE.md](./BATTLE_SYSTEM_COMPLETE.md)** - Implementation summary
- **[REMIX_BATTLE_GUIDE.md](./REMIX_BATTLE_GUIDE.md)** - Complete battle guide
- **[RUN_PROJECT.md](./RUN_PROJECT.md)** - Development setup
- **[DEPLOY_MONAD_TESTNET.md](./DEPLOY_MONAD_TESTNET.md)** - Deployment guide
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

## 🎊 What You Get

1. ✅ **Full On-Chain Remix Competitions** with prize pools
2. ✅ **ERC-20 Prize Token** with public faucet
3. ✅ **Automatic Prize Distribution** to winners
4. ✅ **Fair Voting System** (one vote per wallet)
5. ✅ **Production-Ready UI** (responsive, clean design)
6. ✅ **Monad-Optimized** (fast, low-cost transactions)
7. ✅ **Complete Documentation** (user + developer guides)
8. ✅ **Backend Storage Option** (rapid prototyping)

## 🐛 Troubleshooting

### "Insufficient allowance"
Run the faucet first or approve PRIZE tokens before creating a battle.

### "Already voted"
You can only vote once per battle per wallet address.

### "Host cannot submit remix"
Battle hosts cannot participate in their own competitions.

### Frontend not loading
Check that both frontend (3001) and backend (3002) are running:
```bash
./test-battle-system.sh
```

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## 📄 License

MIT

## 🙏 Acknowledgments

Built on:
- **Monad** - High-performance blockchain
- **OpenZeppelin** - Secure smart contracts
- **Next.js** - React framework
- **ethers.js** - Ethereum library

---

**🏆 Start your remix battle on Monad testnet today!**

