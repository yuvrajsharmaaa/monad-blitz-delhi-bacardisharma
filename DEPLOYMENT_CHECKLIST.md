# ✅ Pre-Deployment Checklist

Complete this checklist before your 40-minute demo to ensure smooth deployment.

---

## 🔧 Environment Setup

### 1. Root Directory `.env` File
- [ ] File exists: `.env` in project root
- [ ] Has `PRIVATE_KEY=your_private_key_here`
- [ ] Has `MONAD_RPC_URL=https://testnet-rpc.monad.xyz`
- [ ] Private key has no "0x" prefix
- [ ] Private key is from MetaMask (Account Details → Export)

### 2. Frontend `.env.local` File
- [ ] File exists: `frontend/.env.local`
- [ ] Has `NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5`
- [ ] Has `NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz`
- [ ] Has `NEXT_PUBLIC_MONAD_CHAIN_ID=10143`
- [ ] Has `NEXT_PUBLIC_BACKEND_ONLY=true` (optional)

### 3. Node Dependencies
- [ ] Run `npm install` in root directory
- [ ] Run `cd frontend && npm install`
- [ ] No error messages
- [ ] Hardhat installed
- [ ] ethers.js v6 installed

---

## 💰 Token Setup

### 1. Host Wallet Preparation
- [ ] MetaMask installed
- [ ] Connected to Monad Testnet
  - Network name: Monad Testnet
  - Chain ID: 10143
  - RPC: https://testnet-rpc.monad.xyz
- [ ] Have MON tokens (run `npx hardhat run scripts/getMON.js --network monad`)
- [ ] Check balance: At least 10 MON for prize + gas

### 2. Test Wallets Ready
- [ ] Have 3+ wallets for remixers (different addresses)
- [ ] Have 5+ wallets for voters (different addresses)
- [ ] All wallets have some gas tokens
- [ ] All wallets added to MetaMask

---

## 📝 Deployment Configuration

### 1. Edit `scripts/deployMVP.js`
- [ ] Set `HOST` to your wallet address (with 0x prefix)
- [ ] Set `TRACK_URI` to your track URI (e.g., `ipfs://QmYourTrack`)
- [ ] Set `PRIZE_TOKEN` to `0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5`
- [ ] Set `PRIZE_AMOUNT` to desired amount (e.g., `'10'` for 10 MON)
- [ ] Save file

### 2. Verify Hardhat Config
- [ ] File exists: `hardhat.config.js`
- [ ] Has `monad` network configuration
- [ ] Points to `https://testnet-rpc.monad.xyz`
- [ ] Chain ID is 10143
- [ ] Accounts use `process.env.PRIVATE_KEY`

---

## 🚀 Pre-Deployment Tests

### 1. Test Connection
```bash
# Run this to verify network connection
npx hardhat console --network monad
> await ethers.provider.getNetwork()
# Should show: { name: 'unknown', chainId: 10143n }
```
- [ ] Connection successful
- [ ] Chain ID is 10143

### 2. Test Account Balance
```bash
# Check your balance
npx hardhat console --network monad
> const [signer] = await ethers.getSigners()
> const balance = await ethers.provider.getBalance(signer.address)
> ethers.formatEther(balance)
```
- [ ] Have enough for gas (at least 0.1 ETH equivalent)

### 3. Test Compilation
```bash
npx hardhat compile
```
- [ ] Compilation successful
- [ ] No errors
- [ ] Artifacts created

---

## 🎬 Deployment Readiness

### 1. Contract Files
- [ ] `contracts/TrackVoting.sol` exists
- [ ] `contracts/TestPrizeToken.sol` exists
- [ ] Both files compile without errors

### 2. Deployment Scripts
- [ ] `scripts/deployMVP.js` exists and configured
- [ ] `scripts/getMON.js` exists
- [ ] Scripts are executable

### 3. Test Suite
```bash
npx hardhat test test/TrackVoting.test.js
```
- [ ] All 33 tests pass
- [ ] No errors or warnings
- [ ] Test completes in < 2 seconds

---

## 🖥️ Frontend Preparation

### 1. Dependencies
```bash
cd frontend
npm install
```
- [ ] Installation successful
- [ ] No peer dependency warnings
- [ ] `node_modules` folder created

### 2. Component Files
- [ ] `components/MVPTrackVoting.js` exists
- [ ] `app/voting/page.js` exists and imports MVPTrackVoting
- [ ] `hooks/useWallet.js` exists
- [ ] `utils/contracts.js` exists (optional)

### 3. Test Dev Server
```bash
cd frontend
npm run dev
```
- [ ] Server starts on port 3001
- [ ] No compilation errors
- [ ] Can access http://localhost:3001
- [ ] Can see header/navigation

---

## 🎮 Demo Materials

### 1. Remix URIs Prepared
- [ ] Have 3+ URIs ready (can be fake for demo):
  - Example: `ipfs://QmRemix1Testing`
  - Example: `ipfs://QmRemix2Testing`
  - Example: `ipfs://QmRemix3Testing`

### 2. Wallet Access
- [ ] Can switch between wallets in MetaMask quickly
- [ ] Know which wallet is host
- [ ] Know which wallets are remixers
- [ ] Know which wallets are voters

### 3. Demo Script
- [ ] Read `MVP_40MIN_DEPLOY.md`
- [ ] Understand flow: Submit → Vote → Approve → End
- [ ] Know timing: 5-10-10-5 minutes per phase
- [ ] Prepared talking points

---

## 📋 Documentation Review

### 1. Read Key Docs
- [ ] Read `MVP_40MIN_DEPLOY.md` (deployment guide)
- [ ] Read `QUICK_REFERENCE.md` (quick commands)
- [ ] Read `ARCHITECTURE.md` (understand flow)
- [ ] Read `MVP_FINAL_SUMMARY.md` (overview)

### 2. Understand Commands
- [ ] Know how to deploy: `npx hardhat run scripts/deployMVP.js --network monad`
- [ ] Know how to get tokens: `npx hardhat run scripts/getMON.js --network monad`
- [ ] Know how to start frontend: `cd frontend && npm run dev`
- [ ] Know how to run tests: `npx hardhat test`

---

## 🐛 Troubleshooting Preparation

### 1. Common Issues Known
- [ ] Know how to approve tokens (yellow button in UI)
- [ ] Know "Only host can end" means wrong wallet
- [ ] Know to check MetaMask network if transactions fail
- [ ] Know to refresh page if events don't update

### 2. Backup Plans
- [ ] Have block explorer ready: https://testnet.monadexplorer.com
- [ ] Can check transactions manually
- [ ] Have extra gas tokens available
- [ ] Know how to redeploy if needed (5 minutes)

---

## ⏱️ Time Management

### 1. Practice Run
- [ ] Done dry run of deployment (< 5 min)
- [ ] Practiced switching wallets quickly
- [ ] Tested submitting remix (< 1 min per submission)
- [ ] Tested voting (< 30 sec per vote)
- [ ] Tested ending voting (< 2 min including approve)

### 2. Buffer Time
- [ ] Built in 5 minutes for issues
- [ ] Have restart plan if something breaks
- [ ] Know critical vs optional steps

---

## 🎯 Final Checks

### 1. Hardware/Software
- [ ] Stable internet connection
- [ ] MetaMask extension working
- [ ] Browser console clear of errors
- [ ] Multiple browser tabs/windows ready

### 2. Audience/Presentation
- [ ] Demo space prepared
- [ ] Screen sharing tested (if remote)
- [ ] Audio working
- [ ] Can see MetaMask confirmations clearly

### 3. Backup Materials
- [ ] Screenshots of successful deployment
- [ ] Recorded video of working demo (optional)
- [ ] Block explorer links saved
- [ ] Documentation printed/accessible

---

## 🚀 Launch Checklist (Do Right Before)

### T-5 Minutes
- [ ] Close unnecessary applications
- [ ] Clear browser cache
- [ ] MetaMask unlocked
- [ ] Terminal windows ready (root dir)
- [ ] Text editor open with deployMVP.js

### T-2 Minutes
- [ ] Verify network connection
- [ ] Check gas balance one more time
- [ ] Have wallet addresses written down
- [ ] Have remix URIs copied

### T-0 (GO TIME!)
- [ ] Take deep breath 😌
- [ ] Run deployment command
- [ ] Follow `MVP_40MIN_DEPLOY.md` timeline
- [ ] Have fun! 🎉

---

## ✅ Success Indicators

You'll know deployment is successful when:

- [ ] ✅ Contract deploys with address printed
- [ ] ✅ Frontend shows track info correctly
- [ ] ✅ Can submit remixes (see them appear)
- [ ] ✅ Can vote (counts update in real-time)
- [ ] ✅ Can approve tokens (get confirmation)
- [ ] ✅ Can end voting (winner banner appears)
- [ ] ✅ Prize distributed (💰 PAID badge shows)
- [ ] ✅ Total time < 40 minutes

---

## 📞 Emergency Contacts

If something goes wrong:

1. **Check browser console** (F12)
   - Look for red errors
   - Check network tab for failed requests

2. **Check terminal output**
   - Look for error messages
   - Check compilation errors

3. **Verify environment variables**
   - `.env` file configured correctly
   - `frontend/.env.local` has contract address

4. **Restart services**
   - Kill frontend: Ctrl+C, restart: `npm run dev`
   - Clear browser cache and refresh

5. **Redeploy if needed**
   - Only takes 5 minutes
   - Keep old deployment as backup

---

## 🎉 Post-Deployment

After successful demo:

- [ ] Save contract address
- [ ] Save transaction hashes
- [ ] Take screenshots of winner
- [ ] Check winner's token balance increased
- [ ] Share demo link/recording
- [ ] Celebrate! 🎊

---

**Print this checklist and mark items as you complete them!**

**Ready to deploy? See `MVP_40MIN_DEPLOY.md` for step-by-step instructions!**
