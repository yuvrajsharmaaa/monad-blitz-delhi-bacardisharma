# Monad Testnet Configuration - Summary

## ✅ What Changed

I've reconfigured your application to work on **Monad Testnet** instead of localhost.

### Files Updated:

1. **`frontend/.env.local`**
   - Changed RPC URL to `https://testnet-rpc.monad.xyz`
   - Changed Chain ID to `10143` (Monad Testnet)
   - Added Chain Name: `Monad Testnet`
   - Contract addresses are now empty (you need to deploy first)

2. **`hardhat.config.js`**
   - Enhanced Monad network config with auto gas settings
   - Fixed private key handling (adds 0x prefix if missing)

3. **`frontend/hooks/useWallet.js`**
   - Already configured to auto-detect chain from RPC
   - Will prompt users to add Monad Testnet to MetaMask
   - Handles chain switching gracefully

## 🚀 Quick Start Guide

### Step 1: Get Testnet Tokens
Visit the Monad faucet and get testnet tokens:
- **Faucet**: https://faucet.monad.xyz/

### Step 2: Setup Your Private Key
Edit `.env` file in the root directory:
```bash
PRIVATE_KEY=your_actual_private_key_without_0x_prefix
```

⚠️ **Security**: Never commit this file! It's already in `.gitignore`.

### Step 3: Deploy Contracts
Run the automated deployment script:
```bash
./deploy-monad.sh
```

This script will:
- Compile your contracts
- Deploy to Monad Testnet
- Extract deployed addresses
- Offer to automatically update `frontend/.env.local`

**OR** deploy manually:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network monad
```

Then manually copy the addresses to `frontend/.env.local`.

### Step 4: Run Your Application

**Terminal 1** - Backend:
```bash
cd backend
node server.js
```

**Terminal 2** - Frontend:
```bash
cd frontend
npm run dev
```

**Terminal 3** - (Optional) Check services:
```bash
./check-services.sh
```

### Step 5: Use the App
1. Open http://localhost:3001
2. Connect MetaMask
3. App will prompt to add/switch to Monad Testnet
4. Start uploading tracks and minting NFTs!

## 📋 Monad Testnet Details

- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Currency**: MON
- **Faucet**: https://faucet.monad.xyz/

## 🔍 Verifying Everything Works

1. **Backend is running**:
   ```bash
   curl http://localhost:3002/health
   ```
   Should return: `{"status":"ok","message":"Server is running"}`

2. **Frontend is configured**:
   ```bash
   cat frontend/.env.local
   ```
   Should show Monad testnet URLs and your deployed contract addresses

3. **Check contract deployment**:
   - Visit Monad testnet explorer (if available)
   - Search for your contract addresses

## 🐛 Troubleshooting

### "Insufficient funds" error
- Get more testnet tokens from faucet
- Wait a few minutes and try again

### "Invalid private key" or "Invalid sender"
- Check `.env` has correct PRIVATE_KEY
- Make sure private key has no 0x prefix in .env
- Verify the wallet has testnet tokens

### MetaMask doesn't show Monad Testnet
- App will auto-prompt to add it on first connect
- Or add manually using the network details above

### Upload works but can't mint NFT
- Check contract addresses are set in `frontend/.env.local`
- Verify you're connected to Monad Testnet in MetaMask
- Check you have testnet tokens for gas

### Wallet chain switching spam
- Already fixed in the code
- If it persists, try refreshing the page

## 📚 Documentation

- **Deployment Guide**: `DEPLOY_MONAD_TESTNET.md` (detailed step-by-step)
- **Quick Start**: `QUICKSTART.md`
- **Run Instructions**: `RUN_PROJECT.md`

## 🎯 What's Working Now

✅ Frontend configured for Monad Testnet  
✅ Wallet auto-adds Monad network  
✅ Backend serves files locally (no IPFS needed)  
✅ Upload endpoint working  
✅ Chain switching handled gracefully  
✅ Contracts ready to deploy  

## ⚠️ Important Notes

1. **Local Backend**: The backend still runs on localhost:3002. For production, deploy it to a cloud service.

2. **File Storage**: Files are stored locally in `backend/uploads/`. For production, use cloud storage or IPFS.

3. **Testnet Only**: This is configured for testnet. For mainnet, you'll need:
   - Real MON tokens (not testnet tokens)
   - Update RPC URL and Chain ID
   - More thorough testing

4. **Security**: Keep your private key safe and never commit `.env` to git!

## 🎉 You're All Set!

Your app is now configured to run on Monad Testnet. Follow the Quick Start Guide above to deploy and run!
