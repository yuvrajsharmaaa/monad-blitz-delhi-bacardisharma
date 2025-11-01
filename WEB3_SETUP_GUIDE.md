# 🌐 Web3 Setup Guide - Enable Full Monad Integration

**Transform from Backend-Only to Full Web3 Mode**

---

## 🎯 Overview

This guide walks you through enabling complete Web3 functionality with Monad testnet, including:
- ✅ On-chain remix submissions and voting
- ✅ Automatic prize distribution via smart contracts
- ✅ Real-time event tracking from blockchain
- ✅ MetaMask wallet integration
- ✅ Token approval flow for prizes

---

## ⚡ Quick Start (5 Minutes)

### 1. Update Frontend Configuration

**File:** `frontend/.env.local`

```bash
# CHANGE THIS LINE:
NEXT_PUBLIC_BACKEND_ONLY=false  # ← Set to false!

# Verify these addresses are set:
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0x7637801a09823b8AF38c0029DAe381EA4c31668b
NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
```

### 2. Restart Frontend

```bash
cd frontend
npm run dev
```

**✅ The backend-only banner should now be GONE!**

---

## 🚀 Full Setup (If Starting Fresh)

### Step 1: Deploy Contracts (if needed)

```bash
# Deploy new TrackVoting contract
npx hardhat run scripts/deployMVP.js --network monad

# Output will show:
# ✅ TrackVoting deployed at: 0xYourNewAddress
```

**Copy the address and update `.env.local`:**
```bash
NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0xYourNewAddress
```

---

### Step 2: Fund Host Wallet

```bash
# Get 100 MON tokens from faucet
npx hardhat run scripts/getMON.js --network monad

# Output:
# 💰 Balance after: 100.0 MON
# 📈 Received: 100.0 MON
```

---

### Step 3: Configure MetaMask

#### Add Monad Testnet to MetaMask

1. Open MetaMask
2. Click network dropdown → **Add Network**
3. Enter these details:

```
Network Name: Monad Testnet
RPC URL: https://testnet-rpc.monad.xyz
Chain ID: 10143
Currency Symbol: MON
Block Explorer: https://testnet.monadexplorer.com
```

4. Click **Save**

#### Import Host Wallet

1. Get your private key from `.env` file (root directory)
2. MetaMask → **Import Account** → Paste private key
3. Switch to Monad Testnet network
4. You should see your MON balance

---

### Step 4: Prepare Test Wallets

For testing, you need multiple wallets:

| Role | Wallet | Purpose |
|------|--------|---------|
| **Host** | Wallet 1 | Creates voting, ends voting, distributes prize |
| **Remixer 1** | Wallet 2 | Submits remix |
| **Remixer 2** | Wallet 3 | Submits remix |
| **Voter 1** | Wallet 4 | Votes for remix |
| **Voter 2** | Wallet 5 | Votes for remix |

**Create wallets in MetaMask:**
- Click account icon → **Create Account**
- Repeat 4-5 times
- Name them: Host, Remixer1, Remixer2, Voter1, Voter2

---

## 🎮 Complete Web3 Flow

### Phase 1: Initial Setup

**As Host (Wallet 1):**

1. Open app: `http://localhost:3001`
2. Click **🗳️ Track Voting** tab
3. Connect MetaMask (should auto-connect)
4. Verify track info shows:
   - Host address matches your wallet
   - Prize pool shows (e.g., 10 MON)
   - Status: 🟢 ACTIVE

---

### Phase 2: Submit Remixes (Web3 Transactions)

**As Remixer 1 (Wallet 2):**

1. Switch MetaMask to Remixer1 account
2. Refresh page
3. Click **📤 Submit Your Remix**
4. Enter remix URI: `ipfs://QmRemix1Testing`
5. Click **Submit**
6. **MetaMask popup appears** → Confirm transaction
7. Wait 30-60 seconds
8. ✅ See "Remix #1 submitted successfully!"

**Repeat for Remixer 2, 3, etc.**

**What Happens:**
- `submitRemix()` called on TrackVoting contract
- Transaction sent to Monad testnet
- `RemixSubmitted` event emitted
- UI updates automatically via event listener
- Remix appears in list with 0 votes

---

### Phase 3: Cast Votes (Web3 Transactions)

**As Voter 1 (Wallet 4):**

1. Switch MetaMask to Voter1 account
2. Refresh page
3. See all submitted remixes
4. Click **🗳️ Vote for This Remix** on Remix #1
5. **MetaMask popup** → Confirm transaction
6. Wait 30-60 seconds
7. ✅ Vote count updates to 1
8. Your vote marked with green ✓ badge

**Repeat with Voter 2, 3, etc.**

**What Happens:**
- `vote(remixId)` called on contract
- Vote stored on-chain
- `VoteCast` event emitted with new count
- UI updates vote count in real-time
- Leaderboard re-sorts (🥇🥈🥉)

---

### Phase 4: Approve Prize Tokens (Web3 Transaction)

**As Host (Wallet 1):**

1. Switch MetaMask back to Host account
2. In **🎛️ Host Controls** section, see:
   ```
   ⚠️ You need to approve the contract to spend 10 MON tokens
   [Approve 10 MON]
   ```
3. Click **Approve 10 MON**
4. **MetaMask popup** → Confirm transaction
5. Wait 30-60 seconds
6. ✅ See "Tokens approved! You can now end voting."

**What Happens:**
- `approve(votingAddress, prizeAmount)` called on TestPrizeToken
- Allowance set for TrackVoting contract
- Button changes to "🏁 End Voting & Distribute Prize"

---

### Phase 5: End Voting & Distribute Prize (Web3 Transaction)

**As Host (Wallet 1):**

1. Click **🏁 End Voting & Distribute Prize**
2. **MetaMask popup** → Confirm transaction
3. See real-time states:
   - 📤 Transaction Pending (MetaMask confirmation)
   - ⏳ Confirming Transaction (on blockchain)
   - ✅ Transaction confirmed!

4. **🏆 VICTORY PANEL APPEARS:**

```
┌─────────────────────────────────────────────────┐
│              🏆 (animated bounce)               │
│                                                 │
│           VOTING COMPLETE!                      │
│                                                 │
│  🥇 Winning Remix: #1                           │
│  👤 Winner Address: 0xabcd...1234               │
│  🗳️ Votes Received: 5                           │
│  💰 Prize Distributed: 10 MON ✅                │
│                                                 │
│  📋 Transaction Details:                        │
│  TX: 0x1234567890abcdef...                      │
│  [View on Explorer 🔗]                          │
│  Status: ✅ Confirmed                           │
└─────────────────────────────────────────────────┘
```

**What Happens:**
- `endVoting()` called on contract
- Winner determined (most votes)
- Prize transferred via `transferFrom(host, winner, amount)`
- `VotingEnded` event emitted
- `PrizeDistributed` event emitted
- UI updates automatically
- Vote buttons disappear
- Status changes to 🔴 ENDED + 💰 PAID

---

### Phase 6: Verify Winner Received Prize

**As Winner (e.g., Remixer 1):**

1. Switch MetaMask to winner's account
2. Check MON balance in MetaMask
3. Should see +10 MON
4. Or check on block explorer:
   ```
   https://testnet.monadexplorer.com/address/0xWinnerAddress
   ```

---

## 🔍 Web3 vs Backend-Only Comparison

| Feature | Backend-Only | Web3 Mode |
|---------|-------------|-----------|
| **Remix Storage** | Local files | On-chain URIs |
| **Vote Storage** | tracks.json | Blockchain state |
| **Prize Distribution** | Manual | Automatic via contract |
| **Wallet Required** | No | Yes (MetaMask) |
| **Transaction Fees** | None | Gas fees (MON) |
| **Transparency** | No | Full (block explorer) |
| **Real-time Updates** | Polling | Events |
| **Security** | Backend trust | Smart contract |
| **Winner Verification** | Trust backend | On-chain proof |

---

## 🔧 Web3 Components Reference

### 1. useWallet Hook

**File:** `frontend/hooks/useWallet.js`

```javascript
// Already implemented - connects MetaMask
const { signer, provider, account } = useWallet();

// signer - for sending transactions
// provider - for reading blockchain
// account - connected wallet address
```

### 2. Contract Instances

```javascript
// TrackVoting contract (read/write)
const contract = new ethers.Contract(
  VOTING_ADDRESS,
  VOTING_ABI,
  provider  // or signer for transactions
);

// TestPrizeToken contract (for approvals)
const tokenContract = new ethers.Contract(
  PRIZE_TOKEN_ADDRESS,
  ERC20_ABI,
  signer
);
```

### 3. Web3 Transaction Flow

```javascript
// 1. Connect signer
const votingWithSigner = contract.connect(signer);

// 2. Call contract function
const tx = await votingWithSigner.vote(remixId);

// 3. Wait for confirmation
const receipt = await tx.wait();

// 4. Transaction confirmed, events emitted
```

### 4. Event Listeners

```javascript
// Listen for VoteCast events
contract.on('VoteCast', (voter, remixId, voteCount) => {
  console.log('Vote cast:', { voter, remixId, voteCount });
  // Update UI
});

// Listen for VotingEnded events
contract.on('VotingEnded', (winningId, winner, votes) => {
  console.log('Winner:', { winningId, winner, votes });
  // Show victory panel
});
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" errors

**Solution:**
- Verify `NEXT_PUBLIC_BACKEND_ONLY=false`
- Restart frontend: `Ctrl+C`, then `npm run dev`
- Hard refresh browser: `Ctrl+Shift+R`

---

### Issue: "Network not supported"

**Solution:**
- MetaMask must be on Monad Testnet (Chain ID 10143)
- Add network manually using settings above
- Refresh page after switching

---

### Issue: "Insufficient allowance"

**Solution:**
- Host must click "Approve Prize Tokens" first
- Wait for approval transaction to confirm
- Then click "End Voting"

---

### Issue: "Only host can end"

**Solution:**
- Check MetaMask is using HOST wallet
- Verify address matches host in track info
- Switch to correct account

---

### Issue: Vote buttons not appearing

**Solution:**
- Must not be host wallet
- Must not have voted already
- Voting must be active (🟢 ACTIVE status)
- Refresh page to reload state

---

### Issue: MetaMask not popping up

**Solution:**
- Click MetaMask extension icon
- Check for pending approval
- May be hidden behind browser windows
- Try disabling popup blockers

---

### Issue: Transactions failing

**Solution:**
- Check wallet has enough MON for gas
- Get more: `npx hardhat run scripts/getMON.js --network monad`
- Verify network is Monad Testnet
- Check contract addresses in `.env.local`

---

## 📊 Gas Costs Reference

| Operation | Gas Cost | MON Needed |
|-----------|----------|------------|
| Submit Remix | ~100,000 | ~0.01 MON |
| Cast Vote | ~80,000 | ~0.008 MON |
| Approve Tokens | ~50,000 | ~0.005 MON |
| End Voting | ~150,000 | ~0.015 MON |

**Note:** Get free MON from faucet: `npx hardhat run scripts/getMON.js --network monad`

---

## 🎯 Key Contract Functions

### TrackVoting.sol

```solidity
// Submit a remix (anyone except host)
function submitRemix(string calldata _remixURI) external

// Vote for a remix (one vote per wallet, host excluded)
function vote(uint256 _remixId) external

// End voting and distribute prize (host only)
function endVoting() external nonReentrant
```

### TestPrizeToken.sol

```solidity
// Get 100 test tokens
function faucet() external

// Approve spending
function approve(address spender, uint256 amount) external returns (bool)
```

---

## 🎓 Best Practices

### For Development

1. **Always test with multiple wallets** - Host, remixers, voters
2. **Check allowance before ending** - Click approve button first
3. **Monitor console logs** - See real-time event data
4. **Use block explorer** - Verify transactions on-chain
5. **Keep private keys safe** - Never commit to git

### For Production

1. **Deploy fresh contracts** - Don't reuse testnet addresses
2. **Audit contracts** - Get security review
3. **Use real IPFS** - Don't use test URIs
4. **Set proper prize amounts** - Fund host wallet adequately
5. **Test error cases** - No tokens, repeat votes, etc.

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| **Monad Testnet RPC** | https://testnet-rpc.monad.xyz |
| **Block Explorer** | https://testnet.monadexplorer.com |
| **TrackVoting Contract** | https://testnet.monadexplorer.com/address/0x7637801a09823b8AF38c0029DAe381EA4c31668b |
| **Prize Token (MON)** | https://testnet.monadexplorer.com/address/0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5 |
| **MetaMask** | https://metamask.io |

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] `NEXT_PUBLIC_BACKEND_ONLY=false` in `.env.local`
- [ ] Frontend restarted after config change
- [ ] Backend-only banner is HIDDEN
- [ ] MetaMask connected to Monad Testnet
- [ ] Host wallet has MON tokens
- [ ] Multiple test wallets created
- [ ] Can submit remix (MetaMask popup appears)
- [ ] Can vote (transaction confirms)
- [ ] Can approve tokens (host only)
- [ ] Can end voting (host only)
- [ ] Victory panel displays winner data
- [ ] Transaction hash clickable
- [ ] Block explorer shows transaction
- [ ] Winner received prize tokens
- [ ] Vote buttons hidden after end
- [ ] Status shows 🔴 ENDED + 💰 PAID

---

## 🎉 Success!

**You now have a fully Web3-enabled music remix voting app on Monad testnet!**

Every action is:
- ✅ On-chain and verifiable
- ✅ Secured by smart contracts
- ✅ Transparent via block explorer
- ✅ Automated prize distribution
- ✅ Real-time event updates

**No backend voting logic - everything on Monad blockchain!** 🚀

---

## 📞 Support

For issues:
1. Check browser console (F12) for errors
2. Verify MetaMask network and account
3. Check contract addresses in `.env.local`
4. See `EVENT_HANDLING_GUIDE.md` for event debugging
5. Review `TROUBLESHOOTING.md` for common issues

---

**Ready to go Web3? Set `BACKEND_ONLY=false` and restart!** 🌐
