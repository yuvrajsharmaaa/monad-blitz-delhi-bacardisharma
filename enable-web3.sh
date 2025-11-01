#!/bin/bash

# 🚀 Web3 Mode Enabler Script
# Switches from backend-only to full Monad Web3 integration

echo "🌐 Enabling Web3 Mode for Monad Testnet..."
echo ""

# Check if .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Error: frontend/.env.local not found!"
    echo "Please create the file first."
    exit 1
fi

# Backup current config
echo "📋 Creating backup of current config..."
cp frontend/.env.local frontend/.env.local.backup
echo "✅ Backup saved as frontend/.env.local.backup"
echo ""

# Update BACKEND_ONLY flag
echo "🔧 Setting NEXT_PUBLIC_BACKEND_ONLY=false..."
sed -i 's/NEXT_PUBLIC_BACKEND_ONLY=true/NEXT_PUBLIC_BACKEND_ONLY=false/' frontend/.env.local
echo "✅ Web3 mode enabled!"
echo ""

# Verify change
if grep -q "NEXT_PUBLIC_BACKEND_ONLY=false" frontend/.env.local; then
    echo "✅ Configuration verified!"
else
    echo "⚠️  Warning: Could not verify change. Please check manually."
fi

echo ""
echo "📋 Current Configuration:"
echo "────────────────────────────────────────"
grep "NEXT_PUBLIC_BACKEND_ONLY" frontend/.env.local
grep "NEXT_PUBLIC_TRACK_VOTING_ADDRESS" frontend/.env.local
grep "NEXT_PUBLIC_PRIZE_TOKEN_ADDRESS" frontend/.env.local
grep "NEXT_PUBLIC_MONAD_RPC_URL" frontend/.env.local
grep "NEXT_PUBLIC_MONAD_CHAIN_ID" frontend/.env.local
echo "────────────────────────────────────────"
echo ""

echo "🎯 Next Steps:"
echo "1. Restart frontend: cd frontend && npm run dev"
echo "2. Open http://localhost:3001"
echo "3. Connect MetaMask to Monad Testnet"
echo "4. Go to Track Voting tab"
echo "5. Test Web3 flow: Submit → Vote → End"
echo ""

echo "📚 Documentation:"
echo "- See WEB3_SETUP_GUIDE.md for complete instructions"
echo "- See EVENT_HANDLING_GUIDE.md for event system"
echo "- See MVP_40MIN_DEPLOY.md for deployment"
echo ""

echo "✨ Web3 mode is now ENABLED!"
echo "🚀 Ready to use Monad testnet!"
