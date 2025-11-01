# 🎵 SONAD - Sound on Monad

**Decentralized music platform and remix competitions on Monad blockchain**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## 🚀 Features

- **Multi-Remix Battles**: Multiple submissions per contest with community voting
- **Prize Distribution**: Automatic on-chain prize payouts to winners
- **Track Management**: Upload and manage music tracks
- **Wallet Integration**: Seamless MetaMask connection
- **Monad Testnet**: Built on high-performance Monad blockchain

## 📦 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Blockchain**: Ethers.js v6, Monad Testnet
- **Deployment**: Vercel (optimized)
- **Smart Contracts**: Solidity 0.8.24

## 🏗️ Project Structure

```
frontend/
├── app/
│   ├── page.js              # Main app with tabs
│   ├── layout.js            # Root layout with metadata
│   ├── globals.css          # Global styles
│   └── battles/             # Remix battles route
├── components/
│   ├── Header.js            # Navigation header
│   ├── MultiRemixBattle.js  # Contest management
│   ├── TracksPage.js        # Track listing
│   ├── UploadTrack.js       # Track upload
│   └── SingleTrackVoting.js # Voting interface
├── hooks/
│   └── useWallet.js         # Wallet connection hook
├── public/
│   └── logo.png             # SONAD logo
└── next.config.js           # Next.js configuration
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Monad Testnet configured

### Installation

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_MULTI_REMIX_ADDRESS=0xC0680334aA6b5B0aFc8253aE73900F3cC2e98B4D
NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS=0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5
```

## 📱 Features Breakdown

### Remix Battles
- Create contests with prize pools
- Submit multiple remixes per contest
- Input custom payout wallet addresses
- Community voting (one vote per wallet)
- Automatic prize distribution to winners

### Track Management
- Upload original tracks
- View track details and metadata
- Support for MP3 format
- IPFS-compatible URIs

### Wallet Integration
- MetaMask connection
- Network switching to Monad
- Transaction signing
- Balance display

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel Dashboard

3. **Deploy**: Automatic on git push

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide.

### Performance Targets
- ✅ Lighthouse Score: 90+
- ✅ First Load JS: < 200KB
- ✅ Build Time: < 60s

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run analyze  # Analyze bundle size
```

### Code Quality

- **Dynamic Imports**: Heavy components lazy-loaded
- **Tree Shaking**: Unused code eliminated
- **Minification**: SWC-based compression
- **Code Splitting**: Ethers.js in separate chunk

## 📊 Smart Contracts

### MultiRemixContest
- **Address**: `0xC0680334aA6b5B0aFc8253aE73900F3cC2e98B4D`
- **Functions**:
  - `createContest(trackURI, prizeAmount)`
  - `submitRemix(contestId, remixURI, payoutWallet)`
  - `vote(contestId, submissionId)`
  - `endContestAndPay(contestId)`

### TestPrizeToken (MON)
- **Address**: `0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5`
- **Type**: ERC-20 token for prizes

## 🎯 Optimization Highlights

### Bundle Size
- Main Bundle: ~140KB
- Ethers Chunk: ~175KB
- Total First Load: ~185KB

### Performance
- Server-Side Rendering (SSR) ready
- Image optimization (AVIF/WebP)
- Font optimization
- Static asset caching (1 year)

### Security
- Environment variable validation
- HTTPS enforced
- CORS configured
- Rate limiting ready

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

This project is MIT licensed.

## 🔗 Links

- **Monad Testnet**: https://testnet.monad.xyz
- **Documentation**: https://docs.monad.xyz
- **Explorer**: https://testnet.monadexplorer.com

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Contact: [Your Contact Info]

---

**Built with ❤️ for Monad Blitz Delhi**
