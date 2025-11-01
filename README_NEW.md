# 🎵 Music Remix Competition Platform on Monad

**⏱️ 40-Minute MVP Ready!** A production-grade decentralized platform for music remix competitions built on the Monad blockchain with on-chain voting, prize pools, and automatic winner determination.

---

## ⚡ Quick Start (40 Minutes)

```bash
# 1. Deploy contract (5 min)
npx hardhat run scripts/deployMVP.js --network monad

# 2. Configure frontend (2 min)
# Add contract address to frontend/.env.local

# 3. Start app (3 min)
cd frontend && npm run dev

# 4. Demo flow (30 min)
# Submit remixes → Vote → Approve tokens → End voting → Prize sent! 🏆
```

**📚 Complete guide: [MVP_40MIN_DEPLOY.md](./MVP_40MIN_DEPLOY.md)**  
**✅ Checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**  
**🎯 Quick reference: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**

---

## 🎯 What's Included

This platform offers TWO complete voting systems:

### 1️⃣ **TrackVoting** - MVP Single-Track System ⭐ NEW!
Perfect for quick demos and single-track competitions.

**Key Features:**
- ⚡ Deploy in < 5 minutes
- 🏆 Single-page interface (no navigation)
- 💰 Automatic prize distribution in one transaction
- 🔒 Security hardened (ReentrancyGuard + validation)
- 📊 O(1) vote caching for gas optimization
- 🎨 Real-time UI updates via events
- ✅ 33 comprehensive passing tests

**Flow:**
```
Host uploads track → Remixers submit → Users vote → Host ends → Winner paid!
```

**Best for:** Quick demos, single competitions, rapid deployment

---

### 2️⃣ **RemixBattle** - Multi-Battle Platform
Scalable platform for running multiple battles simultaneously.

**Key Features:**
- 🏟️ Multiple battles at once
- 🎵 Each battle has own prize pool
- 📊 Battle grid with status tracking
- 🏆 Independent winner per battle
- 🎮 Complex competition structures

**Flow:**
```
Create battle → Submit remixes → Users vote → End battle → Distribute prize
```

**Best for:** Large-scale platforms, multiple competitions, long-term use

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│           Frontend (Next.js)                │
│  • MVPTrackVoting (single-page)             │
│  • RemixBattlePage (battle grid)            │
│  • Real-time event listeners                │
└─────────────────┬───────────────────────────┘
                  │ ethers.js v6
┌─────────────────▼───────────────────────────┐
│        Smart Contracts (Solidity)           │
│  • TrackVoting.sol (single track)           │
│  • RemixBattle.sol (multi-battle)           │
│  • TestPrizeToken.sol (ERC-20 MON)          │
└─────────────────┬───────────────────────────┘
                  │ Deployed on
┌─────────────────▼───────────────────────────┐
│          Monad Testnet                      │
│  Chain ID: 10143                            │
│  RPC: https://testnet-rpc.monad.xyz         │
└─────────────────────────────────────────────┘
```

---

## 🚀 Features Breakdown

### MVP TrackVoting Features

#### Smart Contract (`TrackVoting.sol`)
- ✅ **submitRemix()** - Anyone can submit (host excluded)
- ✅ **vote()** - One vote per wallet with caching
- ✅ **endVoting()** - Host-only, finds winner, sends prize
- ✅ **voteCache mapping** - O(1) vote access
- ✅ **ReentrancyGuard** - Prevents reentrancy attacks
- ✅ **Prize validation** - Multiple safety checks
- ✅ **Event emissions** - Real-time UI updates

#### Frontend (`MVPTrackVoting.js`)
- 🎨 **Track info display** - Host, prize pool, status
- 📤 **Remix submission form** - With validation
- 🗳️ **Vote buttons** - One-click voting
- 🥇 **Dynamic leaderboard** - Medals for top 3
- 🏆 **Winner banner** - Trophy and prize info
- 💰 **Status badges** - 🟢 ACTIVE, 🔴 ENDED, 💰 PAID
- ✓ **Vote markers** - Shows user's choice
- ⚡ **Real-time updates** - No refresh needed

#### Security
- 🔒 **ReentrancyGuard** on endVoting()
- 🚫 **Host restrictions** - Can't vote or submit
- 1️⃣ **One vote per wallet** - hasVoted mapping
- ✅ **Double-distribution prevention** - prizeDistributed check
- 🔐 **Allowance system** - Host must approve tokens first

### RemixBattle Features

#### Smart Contract (`RemixBattle.sol`)
- ✅ **createBattle()** - Start new competition
- ✅ **submitRemix()** - Submit to specific battle
- ✅ **voteRemix()** - Vote for remix in battle
- ✅ **endBattle()** - Determine winner, send prize
- ✅ **Battle struct** - Complete battle state
- ✅ **Global remix counting** - Unique IDs

#### Frontend (`RemixBattlePage.js`)
- 🎨 **Battle grid** - Card-based layout
- 🆕 **Create battle modal** - Form with validation
- 📤 **Remix upload modal** - Per-battle submission
- 🗳️ **Vote buttons** - Per-remix voting
- 📊 **Battle statistics** - Remixes, votes, status
- 🏆 **Winner display** - On battle completion

### Shared Features

#### TestPrizeToken (MON)
- 💰 **ERC-20 standard** - Full compliance
- 🚰 **Public faucet** - 100 MON per call
- ✅ **Approval system** - Standard ERC-20 allowances
- 🔄 **Transferable** - Can be sent between wallets

#### Backend (Optional)
- 📁 **File uploads** - Multer integration
- 💾 **Local storage** - backend/uploads directory
- 📄 **Metadata** - backend/data/tracks.json
- 🔌 **REST API** - Express endpoints
- 🎵 **Audio support** - MP3, WAV, etc.

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Smart Contracts** | Solidity | 0.8.24 |
| **Development** | Hardhat | Latest |
| **Security** | OpenZeppelin | Latest |
| **Frontend** | Next.js | 14.2.33 |
| **UI Library** | React | 18 |
| **Styling** | Tailwind CSS | Latest |
| **Web3** | ethers.js | v6 |
| **Backend** | Express.js | Latest |
| **File Upload** | Multer | Latest |
| **Testing** | Mocha + Chai | Latest |
| **Blockchain** | Monad Testnet | Chain ID 10143 |

---

## 📦 Deployed Contracts (Monad Testnet)

### Prize Token (Shared by Both Systems)
```
TestPrizeToken: 0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5

Features:
  • ERC-20 standard compliant
  • Faucet: 100 MON per call
  • Get tokens: npx hardhat run scripts/getMON.js --network monad
```

### TrackVoting System (MVP) ⭐
```
TrackVoting: 0x7637801a09823b8AF38c0029DAe381EA4c31668b

Features:
  • Single-track focus
  • Automatic prize distribution
  • 33 passing tests
  • Deploy: npx hardhat run scripts/deployMVP.js --network monad
  • Frontend: http://localhost:3001 → 🗳️ Track Voting tab
```

### RemixBattle System
```
RemixBattle: 0xDC642fC6f697E524Ac4d8EFADD80C459297aa4B2
MusicNFT:    0x21D652731fd29111714D60d99b641d52aF8D1251
VotingContract: 0x1dE4545be0a494716153F1Adb505F629905159C3

Features:
  • Multi-battle platform
  • Battle creation and management
  • Deploy: npx hardhat run scripts/deployBattle.js --network monad
  • Frontend: http://localhost:3001 → ⚔️ Battles tab
```

### Network Details
```
Name:     Monad Testnet
Chain ID: 10143
RPC URL:  https://testnet-rpc.monad.xyz
Explorer: https://testnet.monadexplorer.com
Symbol:   MON
```

---

## 🎮 Usage Guides

### Quick Start: TrackVoting (40 minutes)

**1. Deploy Contract (5 min)**
```bash
# Edit scripts/deployMVP.js with your config
npx hardhat run scripts/deployMVP.js --network monad
# Copy the contract address
```

**2. Configure Frontend (2 min)**
```bash
# Create/edit frontend/.env.local
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0xYourDeployedAddress
NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
```

**3. Start Frontend (3 min)**
```bash
cd frontend
npm install
npm run dev
# Visit: http://localhost:3001
# Click: 🗳️ Track Voting
```

**4. Demo Flow (30 min)**
- **Submit Remixes** (10 min): Use 3+ different wallets
- **Cast Votes** (10 min): Get 5-10 votes from users
- **Approve & End** (10 min): Host approves tokens → ends voting
- **Prize Sent!** 🏆 Winner receives MON automatically

**Full guide:** [MVP_40MIN_DEPLOY.md](./MVP_40MIN_DEPLOY.md)

---

### RemixBattle Usage

**1. Create Battle**
```bash
npx hardhat run scripts/deployBattle.js --network monad
```

**2. Navigate to Battles**
- Go to http://localhost:3001
- Click **⚔️ Battles** tab
- Click **Create Battle** button

**3. Submit & Vote**
- Remixers click **Submit Remix**
- Voters click **Vote** buttons
- Watch leaderboard update

**4. End Battle**
- Battle creator clicks **End Battle**
- Winner determined
- Prize distributed

**Full guide:** [REMIX_BATTLE_GUIDE.md](./REMIX_BATTLE_GUIDE.md)

---

## 🧪 Testing

### Run All Tests
```bash
npx hardhat test
```

### Test Specific Contract
```bash
# TrackVoting (33 tests)
npx hardhat test test/TrackVoting.test.js

# VotingContract
npx hardhat test test/VotingContract.test.js

# MusicNFT
npx hardhat test test/MusicNFT.test.js
```

### Test Coverage
```
TrackVoting Contract
  Deployment ✓
  Remix Submission ✓
  Voting ✓
  Ending Voting ✓
  Edge Cases ✓
  Security ✓
  Gas Optimization ✓

33 passing (997ms)
```

---

## 📁 Project Structure

```
MonadFinal/
├── contracts/
│   ├── TrackVoting.sol          # MVP single-track voting
│   ├── RemixBattle.sol          # Multi-battle platform
│   ├── TestPrizeToken.sol       # ERC-20 MON token
│   ├── MusicNFT.sol             # NFT for tracks
│   └── VotingContract.sol       # Legacy voting
├── scripts/
│   ├── deployMVP.js             # ⭐ Optimized MVP deployment
│   ├── getMON.js                # Get tokens from faucet
│   ├── deployTrackVoting.js     # Deploy TrackVoting
│   └── deployBattle.js          # Deploy RemixBattle
├── test/
│   ├── TrackVoting.test.js      # 33 comprehensive tests
│   ├── VotingContract.test.js
│   └── MusicNFT.test.js
├── frontend/
│   ├── app/
│   │   ├── page.js              # Main navigation
│   │   ├── voting/page.js       # Track Voting route
│   │   └── battles/page.js      # Battles route
│   ├── components/
│   │   ├── MVPTrackVoting.js    # ⭐ MVP component
│   │   ├── RemixBattlePage.js   # Battle grid
│   │   ├── BattleCard.js        # Individual battle
│   │   └── SingleTrackVoting.js # Original component
│   └── hooks/
│       └── useWallet.js         # Wallet connection
├── backend/
│   ├── server.js                # Express API
│   ├── uploads/                 # Audio files
│   └── data/tracks.json         # Metadata
├── docs/
│   ├── MVP_40MIN_DEPLOY.md      # ⭐ Complete deployment guide
│   ├── DEPLOYMENT_CHECKLIST.md  # Pre-deployment checklist
│   ├── QUICK_REFERENCE.md       # Quick commands
│   ├── ARCHITECTURE.md          # System architecture
│   ├── MVP_FINAL_SUMMARY.md     # Implementation summary
│   ├── TRACK_VOTING_GUIDE.md    # Detailed voting guide
│   └── SYSTEM_COMPARISON.md     # Compare both systems
├── hardhat.config.js            # Hardhat + Monad config
├── package.json
└── README.md                    # This file
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [MVP_40MIN_DEPLOY.md](./MVP_40MIN_DEPLOY.md) | Complete 40-minute deployment guide |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-deployment checklist |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Quick commands and tips |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture with diagrams |
| [MVP_FINAL_SUMMARY.md](./MVP_FINAL_SUMMARY.md) | MVP implementation summary |
| [TRACK_VOTING_GUIDE.md](./TRACK_VOTING_GUIDE.md) | Detailed TrackVoting usage |
| [SYSTEM_COMPARISON.md](./SYSTEM_COMPARISON.md) | TrackVoting vs RemixBattle |

---

## 🔒 Security Features

- **ReentrancyGuard** - Prevents reentrancy attacks on prize distribution
- **Access Control** - Host-only functions for ending voting
- **Vote Limits** - One vote per wallet enforcement
- **Host Restrictions** - Host cannot vote or submit remixes
- **Prize Validation** - Multiple checks before distribution
- **Allowance System** - Host must approve token spending
- **Double Distribution Prevention** - prizeDistributed flag
- **Gas Optimization** - Vote caching reduces costs

---

## ⚡ Performance

### Gas Costs (Approximate)
```
Deploy TrackVoting:     ~1,200,000 gas
Submit Remix:           ~100,000 gas
Cast Vote:              ~80,000 gas
End Voting (+ prize):   ~150,000 gas
Approve Tokens:         ~50,000 gas
```

### Timing
```
Event updates:          < 1 second
Transaction confirm:    30-60 seconds
Full MVP demo:          15-25 minutes
```

### Optimization Techniques
- **Vote caching**: O(1) winner selection (no loops)
- **Incremental updates**: Only update changed values
- **Event-driven UI**: No polling, instant feedback
- **Minimal storage**: Efficient data structures

---

## 🆘 Troubleshooting

### Common Issues

**"Only host can end"**
- You're not using the host wallet
- Check MetaMask account matches HOST address

**"Approve Tokens First"**
- Click yellow **Approve 10 MON** button in Host Controls
- Wait for transaction to confirm

**"Insufficient allowance"**
- Your balance is too low
- Get tokens: `npx hardhat run scripts/getMON.js --network monad`

**Events Not Updating**
- Check browser console (F12) for errors
- Verify contract address in `.env.local`
- Refresh page to re-establish listeners

**Network Errors**
- Add Monad Testnet to MetaMask:
  - Name: Monad Testnet
  - Chain ID: 10143
  - RPC: https://testnet-rpc.monad.xyz

---

## 🎓 Learn More

### Understand the Flow
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for visual diagrams
2. See [MVP_40MIN_DEPLOY.md](./MVP_40MIN_DEPLOY.md) for step-by-step
3. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for commands

### Compare Systems
- [SYSTEM_COMPARISON.md](./SYSTEM_COMPARISON.md) - TrackVoting vs RemixBattle
- When to use single-track vs multi-battle
- Feature comparison table

### Deployment
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Complete checklist
- Pre-deployment preparation
- Success criteria

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Contract deploys with address
- ✅ Frontend shows track info
- ✅ Can submit remixes (see them appear)
- ✅ Can vote (counts update real-time)
- ✅ Can approve tokens (get confirmation)
- ✅ Can end voting (winner banner appears)
- ✅ Prize distributed (💰 PAID badge)
- ✅ Total time < 40 minutes

---

## 🚀 Quick Commands

```bash
# Get test tokens
npx hardhat run scripts/getMON.js --network monad

# Deploy MVP
npx hardhat run scripts/deployMVP.js --network monad

# Run tests
npx hardhat test test/TrackVoting.test.js

# Start frontend
cd frontend && npm run dev

# Start backend (optional)
cd backend && npm start

# Compile contracts
npx hardhat compile

# Check network connection
npx hardhat console --network monad
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎯 Next Steps

After successful MVP deployment:

1. **Test Complete Flow** - Run through with multiple wallets
2. **Add IPFS** - Integrate actual audio file storage
3. **Scale Up** - Run multiple votings simultaneously  
4. **NFT Rewards** - Mint winner NFTs automatically
5. **Analytics** - Add vote tracking dashboard
6. **Mobile App** - Build React Native version

---

## 💡 Key Innovations

- **40-Minute MVP** - Optimized for rapid deployment
- **Single Transaction Prize** - Winner paid immediately
- **O(1) Vote Caching** - Gas-efficient winner selection
- **Event-Driven UI** - No polling, instant updates
- **Security First** - Multiple validation layers
- **Two Systems** - Choose single-track OR multi-battle
- **Production Ready** - 33 passing tests, full documentation

---

**⏱️ READY TO DEPLOY IN 40 MINUTES! 🚀**

**Start here:** [MVP_40MIN_DEPLOY.md](./MVP_40MIN_DEPLOY.md)
