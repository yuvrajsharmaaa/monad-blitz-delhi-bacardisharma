# Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. A Monad-compatible wallet with testnet MON tokens
3. IPFS node or gateway access (we use public IPFS gateway)

## Setup

### 1. Install Dependencies

```bash
# Root directory
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure Environment

Create `.env` file in root:

```bash
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=your_private_key_here
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
```

### 3. Deploy Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Monad testnet
npx hardhat run scripts/deploy.js --network monad
```

Copy the deployed addresses to `frontend/.env.local`.

### 4. Create Competition

```bash
npx hardhat run scripts/createCompetition.js --network monad <trackId> <duration> <prizeAmount>
```

Example:
```bash
npx hardhat run scripts/createCompetition.js --network monad 1 86400 1.0
```

### 5. Run Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## Architecture

### Smart Contracts

- **MusicNFT**: ERC721 contract for minting original tracks and remixes
- **VotingContract**: Handles voting, competition management, and prize distribution

### Dynamic Programming Optimizations

1. **Memoized Vote Counts**: Vote counts are cached in `voteCache` mapping
2. **Incremental Updates**: Votes update cache directly instead of recalculating
3. **Frontend Caching**: Vote events cached client-side to avoid redundant RPC calls

### IPFS Integration

- Audio files uploaded to IPFS
- Metadata JSON stored on IPFS
- IPFS hashes stored on-chain for NFT metadata

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/MusicNFT.test.js
```

## Monad Optimizations

The contracts are optimized for Monad's parallel execution:

- Minimal on-chain storage (only IDs and IPFS hashes)
- Incremental state updates
- Memoized read operations
- Event-driven architecture for efficient indexing

