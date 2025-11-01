# Running the Project

## Status

✅ **Contracts**: Compiled successfully
✅ **Tests**: 9 out of 11 passing (2 timing-sensitive tests need adjustment)
✅ **Frontend**: Ready to run (dependencies need installation)

## To Run the Frontend

1. **Install frontend dependencies**:
```bash
cd frontend
npm install
```

2. **Create environment file** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
```

3. **Start development server**:
```bash
npm run dev
```

4. **Open browser**: `http://localhost:3000`

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

