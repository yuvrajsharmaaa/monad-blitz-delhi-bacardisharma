# Deploy to Monad Testnet

This guide will help you deploy your Music NFT platform to Monad testnet.

## Prerequisites

1. **Get Monad Testnet Tokens**
   - Visit Monad testnet faucet: https://faucet.monad.xyz/
   - Get testnet tokens for your wallet address

2. **Setup Private Key**
   - Export your private key from MetaMask (Settings → Security & Privacy → Show Private Key)
   - Update `.env` file in the root directory:
   ```bash
   MONAD_RPC_URL=https://testnet-rpc.monad.xyz
   MONAD_CHAIN_ID=10143
   PRIVATE_KEY=your_actual_private_key_without_0x_prefix
   ```
   - ⚠️ **NEVER commit your private key to git!**

## Deployment Steps

### 1. Install Dependencies (if not already done)
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Compile Contracts
```bash
npx hardhat compile
```

### 3. Deploy to Monad Testnet
```bash
npx hardhat run scripts/deploy.js --network monad
```

This will output something like:
```
Deploying contracts to Monad testnet...
MusicNFT deployed to: 0xAbC123...
VotingContract deployed to: 0xDeF456...
```

### 4. Update Frontend Configuration
Copy the deployed addresses to `frontend/.env.local`:
```bash
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=0xAbC123...  # Your MusicNFT address
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=0xDeF456...  # Your VotingContract address
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
```

### 5. Add Monad Testnet to MetaMask

If MetaMask doesn't have Monad testnet, add it manually:
- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Currency Symbol**: MON
- **Block Explorer**: (if available)

Or the app will automatically prompt to add it when you connect.

## Running the Application

### Terminal 1 - Backend Server
```bash
cd backend
node server.js
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Access the App
- Open http://localhost:3001
- Connect your MetaMask wallet
- Switch to Monad Testnet (app will prompt if needed)
- Start uploading and minting tracks!

## Troubleshooting

### "Insufficient funds" error
- Get more testnet tokens from the faucet

### "Invalid sender" or deployment fails
- Verify your PRIVATE_KEY is correct in `.env`
- Ensure you have testnet tokens

### MetaMask connection issues
- Make sure you're on Monad Testnet network
- Refresh the page and reconnect

### Tracks not appearing
- Ensure backend server is running on port 3002
- Check browser console for errors

## Security Notes

- ✅ `.env` is in `.gitignore` - your private key is safe
- ✅ Never share your private key
- ✅ Use a testnet wallet, not your mainnet wallet
- ✅ The app uses local backend for file storage (no IPFS costs)

## What's Next?

After deployment:
1. Upload original tracks
2. Other users can upload remixes
3. Vote on remixes
4. Create competitions
5. Declare winners

For production deployment, consider:
- Deploying backend to a cloud service (AWS, Railway, Render)
- Using a decentralized storage solution (IPFS, Arweave)
- Adding proper authentication
- Implementing rate limiting
