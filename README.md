# Music Remix Competition Platform on Monad

A full-stack decentralized MVP for a music remix competition platform built on the Monad blockchain with dynamic programming optimizations for high performance.

## Features

- ✅ NFT minting for original tracks and remixes with IPFS metadata
- ✅ On-chain voting with dynamic programming/memoization optimizations
- ✅ IPFS integration for decentralized audio storage
- ✅ Automatic prize distribution to winners
- ✅ Real-time voting interface with live updates
- ✅ Competition countdown timer and winner announcements
- ✅ Responsive UI with Tailwind CSS
- ✅ Gas-optimized smart contracts for Monad's parallel execution

## Tech Stack

- **Smart Contracts**: Solidity 0.8.24, OpenZeppelin, Hardhat
- **Frontend**: Next.js 14, React 18, ethers.js 6
- **Storage**: IPFS (decentralized file storage)
- **Blockchain**: Monad Testnet
- **Testing**: Mocha, Chai

## Architecture

### Dynamic Programming Optimizations

1. **On-Chain Memoization**: Vote counts cached in `voteCache` mapping to avoid recomputation
2. **Incremental Updates**: Votes update cache directly instead of full state scan
3. **Frontend Caching**: Event listeners cache vote data to minimize RPC calls
4. **Optimized Storage**: Only store essential data (IDs, IPFS hashes) on-chain

### Smart Contracts

- **MusicNFT.sol**: ERC721 contract for minting original tracks and remixes
- **VotingContract.sol**: Voting system with `tallyVotes()` using memoization and `declareWinner()` using cached results

## Quick Start

### Prerequisites

- Node.js 18+
- Monad-compatible wallet (MetaMask)
- IPFS gateway access (public gateway used by default)

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
```

### Configuration

1. Create `.env` in root directory:
```bash
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=your_private_key_here
```

2. Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
```

### Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Monad testnet
npx hardhat run scripts/deploy.js --network monad

# Copy deployed addresses to frontend/.env.local
# Then create a competition:
npx hardhat run scripts/createCompetition.js --network monad <trackId> <durationSeconds> <prizeAmountInETH>
```

### Run Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
├── contracts/
│   ├── MusicNFT.sol           # NFT minting contract
│   └── VotingContract.sol    # Voting with dynamic programming
├── frontend/
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks (wallet)
│   └── utils/                 # Utilities (contracts, IPFS)
├── scripts/
│   ├── deploy.js              # Contract deployment
│   └── createCompetition.js   # Competition creation script
├── test/
│   ├── MusicNFT.test.js       # NFT contract tests
│   └── VotingContract.test.js # Voting contract tests
├── ipfs/
│   ├── ipfs-client.js         # IPFS upload/download
│   └── metadata-schema.js     # Metadata schemas
└── hardhat.config.js          # Hardhat configuration
```

## Testing

```bash
# Run all tests
npm test

# Run specific test
npx hardhat test test/VotingContract.test.js
```

## Key Features Explained

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

### IPFS Integration

- Audio files (MP3/WAV) uploaded to IPFS
- Metadata JSON stored on IPFS
- Only IPFS hashes stored on-chain
- Frontend fetches files from IPFS gateways

### Monad Optimizations

- Minimal on-chain storage
- Incremental state updates
- Event-driven architecture
- Optimized for parallel execution

## Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing](./CONTRIBUTING.md)

## License

MIT

