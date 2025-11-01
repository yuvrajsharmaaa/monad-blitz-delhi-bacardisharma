# Quick Start Guide

## Prerequisites
- Node.js 18+
- MetaMask wallet extension

## Running the Application

You need **3 terminal windows** open. Run these commands in order:

### Terminal 1: Hardhat Node
```bash
cd /home/yuvrajs/Desktop/MonadFInal
npx hardhat node
```
**Keep this running!** It provides the local blockchain.

### Terminal 2: Deploy Contracts (one-time)
Wait for Terminal 1 to show "Started HTTP", then run:
```bash
cd /home/yuvrajs/Desktop/MonadFInal
npx hardhat run scripts/deploy.js --network localhost
```
You should see contract addresses printed. These are already in `frontend/.env.local`.

### Terminal 3: Backend Server
```bash
cd /home/yuvrajs/Desktop/MonadFInal/backend
node server.js
```
**Keep this running!** Backend runs on http://localhost:3002

### Terminal 4: Frontend
```bash
cd /home/yuvrajs/Desktop/MonadFInal/frontend
npm run dev
```
**Keep this running!** Frontend runs on http://localhost:3001

## MetaMask Setup

1. Add Localhost Network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency: `ETH`

2. Import Test Account:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 ETH for testing

## Troubleshooting

### "Failed to fetch" error in browser
- Make sure Terminal 1 (Hardhat node) is still running
- Refresh the page

### "Cannot connect to backend" error
- Make sure Terminal 3 (Backend) is running
- Check http://localhost:3002/health should return "OK"

### Contracts not configured warning
- Run the deploy script in Terminal 2
- Restart the frontend (Terminal 4)

## File Storage

- Audio files: `backend/uploads/`
- Metadata: Stored with audio file info
- Smart contract only stores metadata reference IDs

## Testing

1. Connect MetaMask (switch to Hardhat Local network)
2. Go to "Upload Track" tab
3. Fill in title, description
4. Select an audio file (MP3/WAV)
5. Click "Upload Track"
6. Approve MetaMask transaction
7. Wait for NFT to be minted!

## Dynamic Programming Features

- ✅ Memoized vote counts (cached in smart contract)
- ✅ Incremental vote updates (no recalculation)
- ✅ Frontend caching of blockchain events
- ✅ Optimized for Monad's parallel execution
