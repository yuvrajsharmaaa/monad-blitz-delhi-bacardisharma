# 🎨 MVP System Architecture & Flow

Visual guide to the Track Voting MVP system

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        MVPTrackVoting.js Component                   │  │
│  │  • Track Info Display                                │  │
│  │  • Remix Submission Form                             │  │
│  │  • Vote Buttons                                      │  │
│  │  • Host Controls                                     │  │
│  │  • Winner Display                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│                   ethers.js v6                              │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                 BLOCKCHAIN LAYER                            │
│                                                             │
│  ┌────────────────────┐      ┌──────────────────────────┐  │
│  │  TrackVoting.sol  │      │  TestPrizeToken.sol      │  │
│  │  • submitRemix()  │◄─────┤  • ERC-20 Standard       │  │
│  │  • vote()         │      │  • faucet()              │  │
│  │  • endVoting()    │      │  • approve()             │  │
│  │  • voteCache      │      │  • transferFrom()        │  │
│  │  • getAllRemixes()│      └──────────────────────────┘  │
│  └────────────────────┘                                    │
│          ↕                                                  │
│  ReentrancyGuard + Access Control                          │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                  MONAD TESTNET                              │
│  Chain ID: 10143                                            │
│  RPC: https://testnet-rpc.monad.xyz                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Flow

### 1️⃣ **Deployment Phase**

```
HOST
  │
  ├─► Edit deployMVP.js config
  │   • Set HOST address
  │   • Set TRACK_URI
  │   • Set PRIZE_AMOUNT
  │
  ├─► Run deployment
  │   $ npx hardhat run scripts/deployMVP.js --network monad
  │
  ├─► Get contract address
  │   TrackVoting deployed: 0x...
  │
  └─► Update frontend/.env.local
      NEXT_PUBLIC_TRACK_VOTING_ADDRESS=0x...
```

### 2️⃣ **Submission Phase**

```
REMIXER 1                REMIXER 2                REMIXER 3
    │                        │                        │
    ├─► Connect Wallet       ├─► Connect Wallet       ├─► Connect Wallet
    │   (Not host)           │   (Not host)           │   (Not host)
    │                        │                        │
    ├─► Click Submit         ├─► Click Submit         ├─► Click Submit
    │   Button               │   Button               │   Button
    │                        │                        │
    ├─► Enter URI            ├─► Enter URI            ├─► Enter URI
    │   ipfs://Remix1        │   ipfs://Remix2        │   ipfs://Remix3
    │                        │                        │
    ├─► Confirm Tx           ├─► Confirm Tx           ├─► Confirm Tx
    │                        │                        │
    └─► ✅ Remix #1          └─► ✅ Remix #2          └─► ✅ Remix #3
        submitted                submitted                submitted
            │                        │                        │
            └────────────────────────┴────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  TrackVoting.sol    │
                          │  remixCount = 3     │
                          │  voteCache[1] = 0   │
                          │  voteCache[2] = 0   │
                          │  voteCache[3] = 0   │
                          └─────────────────────┘
```

### 3️⃣ **Voting Phase**

```
VOTER 1          VOTER 2          VOTER 3          VOTER 4          VOTER 5
   │                │                │                │                │
   ├─► Vote #1      ├─► Vote #2      ├─► Vote #1      ├─► Vote #1      ├─► Vote #3
   │                │                │                │                │
   └─► ✅           └─► ✅           └─► ✅           └─► ✅           └─► ✅
       │                │                │                │                │
       └────────────────┴────────────────┴────────────────┴────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  TrackVoting.sol    │
                         │  voteCache[1] = 3   │  ◄─── LEADER! 🥇
                         │  voteCache[2] = 1   │       Runner-up 🥈
                         │  voteCache[3] = 1   │       Third 🥉
                         │                     │
                         │  hasVoted mapping:  │
                         │  voter1 → true      │
                         │  voter2 → true      │
                         │  voter3 → true      │
                         │  voter4 → true      │
                         │  voter5 → true      │
                         └─────────────────────┘
```

### 4️⃣ **Prize Distribution Phase**

```
HOST
  │
  ├─► 1. Approve Tokens
  │   │
  │   ├─► Click "Approve 10 MON"
  │   │
  │   ├─► Confirm Tx
  │   │
  │   └─► ✅ Allowance set
  │       TestPrizeToken.allowance(host, votingContract) = 10 MON
  │
  ├─► 2. End Voting
  │   │
  │   ├─► Click "End Voting & Distribute Prize"
  │   │
  │   ├─► Confirm Tx
  │   │
  │   └─► Contract executes:
  │       ┌────────────────────────────────────────┐
  │       │ function endVoting() {                 │
  │       │   1. Check votingActive = true         │
  │       │   2. Check remixCount > 0              │
  │       │   3. Check !prizeDistributed           │
  │       │   4. Find max votes in cache           │
  │       │      → Winner: Remix #1 (3 votes)      │
  │       │   5. Transfer prize via transferFrom() │
  │       │      → 10 MON to remixer1              │
  │       │   6. Set votingActive = false          │
  │       │   7. Set prizeDistributed = true       │
  │       │   8. Emit events                       │
  │       │ }                                       │
  │       └────────────────────────────────────────┘
  │
  └─► 3. UI Updates
      │
      ├─► VotingEnded event → 🔴 ENDED badge
      │
      ├─► PrizeDistributed event → 💰 PAID badge
      │
      └─► Winner banner appears:
          ┌─────────────────────────────────────┐
          │ 🏆 WINNER!                          │
          │ Remix #1 by 0xRemixer1...           │
          │ ✅ 10 MON tokens sent!              │
          └─────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ 1. Connect Wallet
       ↓
┌──────────────┐
│   ethers.js  │
└──────┬───────┘
       │
       │ 2. Create Contract Instance
       ↓
┌──────────────────────────────────────┐
│        TrackVoting Contract          │
│                                      │
│  State Variables:                    │
│  • host: address                     │
│  • trackURI: string                  │
│  • prizeAmount: uint256              │
│  • votingActive: bool                │
│  • prizeDistributed: bool            │
│  • remixCount: uint256               │
│  • voteCache: mapping(uint => uint)  │
│  • hasVoted: mapping(addr => bool)   │
│  • voterChoice: mapping(addr => uint)│
│                                      │
│  Functions:                          │
│  • submitRemix(uri) ──┐              │
│  • vote(remixId) ─────┼──► Events   │
│  • endVoting() ────────┘              │
└──────┬───────────────────────────────┘
       │
       │ 3. Emit Events
       ↓
┌──────────────────────────────────────┐
│          Event Listeners             │
│  • RemixSubmitted → Update list      │
│  • VoteCast → Update counts          │
│  • VotingEnded → Show winner         │
│  • PrizeDistributed → Show payment   │
└──────┬───────────────────────────────┘
       │
       │ 4. Update UI
       ↓
┌──────────────┐
│   Frontend   │
│  • Status    │
│  • Remixes   │
│  • Votes     │
│  • Winner    │
└──────────────┘
```

---

## 🔒 Security Flow

```
┌─────────────────────────────────────────────────────────┐
│                  endVoting() Security                   │
└─────────────────────────────────────────────────────────┘

1. nonReentrant modifier
   │
   ├─► Check _status != _ENTERED
   │   └─► Prevents reentrancy attacks
   │
2. require(msg.sender == host)
   │
   ├─► Only host can end
   │   └─► Prevents unauthorized ending
   │
3. require(votingActive)
   │
   ├─► Can't end twice
   │   └─► Prevents double ending
   │
4. require(remixCount > 0)
   │
   ├─► Must have submissions
   │   └─► Prevents empty voting
   │
5. require(!prizeDistributed)  ◄── NEW MVP OPTIMIZATION
   │
   ├─► Additional safety check
   │   └─► Prevents double distribution
   │
6. Find winner in voteCache
   │
   ├─► O(1) lookup per remix
   │   └─► Gas optimized
   │
7. prizeToken.transferFrom(host, winner, amount)
   │
   ├─► Transfer prize
   │   └─► Requires prior approval
   │
8. Set prizeDistributed = true
   │
   └─► Mark as complete
```

---

## 🎮 State Machine

```
┌──────────────┐
│   DEPLOYED   │
│              │
│ votingActive │
│   = true     │
└──────┬───────┘
       │
       │ submitRemix()
       ↓
┌──────────────┐
│  ACCEPTING   │
│   REMIXES    │
│              │
│ remixCount++ │
└──────┬───────┘
       │
       │ vote()
       ↓
┌──────────────┐
│   VOTING     │
│   ACTIVE     │
│              │
│ voteCache[i++]
└──────┬───────┘
       │
       │ approve() [TestPrizeToken]
       ↓
┌──────────────┐
│  APPROVED    │
│              │
│ allowance    │
│   = 10 MON   │
└──────┬───────┘
       │
       │ endVoting()
       ↓
┌──────────────┐
│   ENDED &    │
│    PAID      │
│              │
│ votingActive │
│   = false    │
│ prizeDist..  │
│   = true     │
└──────────────┘
```

---

## ⚡ Event Flow Timeline

```
Time  Event                     State Change              UI Update
─────────────────────────────────────────────────────────────────────

T+0   Contract Deployed         votingActive = true       Track info loads
      
T+30  RemixSubmitted #1         remixCount = 1            Remix #1 appears
                                voteCache[1] = 0          
      
T+60  RemixSubmitted #2         remixCount = 2            Remix #2 appears
                                voteCache[2] = 0          
      
T+90  RemixSubmitted #3         remixCount = 3            Remix #3 appears
                                voteCache[3] = 0          

T+120 VoteCast → Remix #1       voteCache[1] = 1          Remix #1: 1 vote 🥇
      
T+150 VoteCast → Remix #2       voteCache[2] = 1          Remix #2: 1 vote 🥈
      
T+180 VoteCast → Remix #1       voteCache[1] = 2          Remix #1: 2 votes 🥇
      
T+210 VoteCast → Remix #1       voteCache[1] = 3          Remix #1: 3 votes 🥇
      
T+240 VoteCast → Remix #3       voteCache[3] = 1          Remix #3: 1 vote 🥉

T+300 Token Approval            allowance = 10 MON        ✅ Approved button

T+330 VotingEnded               votingActive = false      🔴 ENDED badge
                                winner = remixer1         
                                winningRemixId = 1        

T+331 PrizeDistributed          prizeDistributed = true   💰 PAID badge
                                (10 MON transferred)      🏆 Winner banner
```

---

## 💾 Storage Optimization

### Before (Naive Approach)
```
struct Remix {
  address remixer;
  string uri;
  uint256 votes;  ◄── Expensive to update every vote!
}

Remix[] public remixes;

// Finding winner requires full loop
for (i = 0; i < remixCount; i++) {
  if (remixes[i].votes > maxVotes) {
    maxVotes = remixes[i].votes;
    winnerId = i;
  }
}
```

### After (MVP Optimization)
```
struct Remix {
  address remixer;
  string uri;
  // No vote counter here!
}

mapping(uint256 => Remix) public remixes;
mapping(uint256 => uint256) public voteCache;  ◄── O(1) access!

// Vote increments cache only
voteCache[remixId]++;  // Single SSTORE

// Finding winner still needs loop but reads are cheaper
for (i = 1; i <= remixCount; i++) {
  if (voteCache[i] > maxVotes) {
    maxVotes = voteCache[i];
    winnerId = i;
  }
}
```

**Savings:**
- Vote: 1 SSTORE instead of struct update
- Winner: Read from mapping instead of array iteration

---

## 🎯 40-Minute Timeline

```
┌─────────────────────────────────────────────────────────────┐
│                    40-MINUTE DEMO                           │
└─────────────────────────────────────────────────────────────┘

00:00 ─┬─ START
       │
       ├─► Deploy contract (scripts/deployMVP.js)
       │   • Edit config
       │   • Run script
       │   • Get address
       │
05:00 ─┼─ CONTRACT DEPLOYED
       │
       ├─► Configure frontend (.env.local)
       │   • Set contract address
       │   • Verify other vars
       │
       ├─► Start frontend (npm run dev)
       │   • Navigate to Track Voting
       │   • Verify track info
       │
10:00 ─┼─ APP RUNNING
       │
       ├─► Submit remixes
       │   • Wallet 1 → Remix #1
       │   • Wallet 2 → Remix #2
       │   • Wallet 3 → Remix #3
       │
15:00 ─┼─ REMIXES SUBMITTED
       │
       ├─► Cast votes
       │   • 5 users vote
       │   • Watch leaderboard
       │   • See real-time updates
       │
25:00 ─┼─ VOTING COMPLETE
       │
       ├─► Approve tokens
       │   • Host approves 10 MON
       │   • Wait for confirmation
       │
30:00 ─┼─ TOKENS APPROVED
       │
       ├─► End voting
       │   • Host clicks button
       │   • Transaction processes
       │   • Winner selected
       │   • Prize transferred
       │
35:00 ─┼─ PRIZE DISTRIBUTED
       │
       ├─► Verify & celebrate
       │   • Check winner banner
       │   • Verify token balance
       │   • Review transaction
       │
40:00 ─┴─ DEMO COMPLETE! 🎉
```

---

## 🎨 UI State Visualization

### Active Voting State
```
┌──────────────────────────────────────────────────────────┐
│  🎵 MVP Track Voting                                     │
│  Single-page voting with instant prize distribution     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📀 Track Details                                        │
│  Host: 0x1234...5678 [YOU]                              │
│  Prize Pool: 10 MON                                      │
│  Status: 🟢 ACTIVE                                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [📤 Submit Your Remix]                                  │
├──────────────────────────────────────────────────────────┤
│  🎵 Remixes (3)                                          │
│                                                          │
│  🥇 Remix #1                  3 votes                    │
│     by 0xaaaa...bbbb                                     │
│     [🗳️ Vote for This Remix]                            │
│                                                          │
│  🥈 Remix #2                  1 vote                     │
│     by 0xcccc...dddd                                     │
│     [🗳️ Vote for This Remix]                            │
│                                                          │
│  🥉 Remix #3                  1 vote                     │
│     by 0xeeee...ffff                                     │
│     [🗳️ Vote for This Remix]                            │
└──────────────────────────────────────────────────────────┘
```

### Ended With Winner State
```
┌──────────────────────────────────────────────────────────┐
│  🎵 MVP Track Voting                                     │
│  Single-page voting with instant prize distribution     │
├──────────────────────────────────────────────────────────┤
│  ✅ 10 MON tokens sent to 0xaaaa...bbbb!                │
├──────────────────────────────────────────────────────────┤
│  📀 Track Details                                        │
│  Host: 0x1234...5678 [YOU]                              │
│  Prize Pool: 10 MON                                      │
│  Status: 🔴 ENDED  💰 PAID                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  ╔════════════════════════════════════════════════════╗ │
│  ║ 🏆 WINNER!                                         ║ │
│  ║ Remix #1 by 0xaaaa...bbbb                          ║ │
│  ║ ✅ 10 MON tokens sent!                             ║ │
│  ╚════════════════════════════════════════════════════╝ │
├──────────────────────────────────────────────────────────┤
│  🎵 Remixes (3)                                          │
│                                                          │
│  🥇🏆 Remix #1 [WINNER]       3 votes                    │
│     by 0xaaaa...bbbb                                     │
│                                                          │
│  🥈 Remix #2                  1 vote                     │
│     by 0xcccc...dddd                                     │
│                                                          │
│  🥉 Remix #3                  1 vote                     │
│     by 0xeeee...ffff                                     │
└──────────────────────────────────────────────────────────┘
```

---

**Complete implementation ready for 40-minute deployment! 🚀**
