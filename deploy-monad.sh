#!/bin/bash

echo "🚀 Deploying to Monad Testnet..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your PRIVATE_KEY"
    exit 1
fi

# Check if private key is set
source .env
if [ "$PRIVATE_KEY" == "your_private_key_here_without_0x_prefix" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env file"
    echo ""
    echo "Steps to fix:"
    echo "1. Export your private key from MetaMask"
    echo "2. Update .env file:"
    echo "   PRIVATE_KEY=your_actual_private_key_without_0x"
    echo ""
    exit 1
fi

echo "📦 Compiling contracts..."
npx hardhat compile

echo ""
echo "🌐 Deploying to Monad Testnet..."
echo "   RPC: ${MONAD_RPC_URL:-https://testnet-rpc.monad.xyz}"
echo "   Chain ID: ${MONAD_CHAIN_ID:-10143}"
echo ""

# Deploy and capture output
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network monad 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract addresses from output
MUSIC_NFT=$(echo "$DEPLOY_OUTPUT" | grep "MusicNFT deployed to:" | awk '{print $4}')
VOTING_CONTRACT=$(echo "$DEPLOY_OUTPUT" | grep "VotingContract deployed to:" | awk '{print $4}')

if [ -n "$MUSIC_NFT" ] && [ -n "$VOTING_CONTRACT" ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Update frontend/.env.local with these addresses:"
    echo ""
    echo "NEXT_PUBLIC_MUSIC_NFT_ADDRESS=$MUSIC_NFT"
    echo "NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=$VOTING_CONTRACT"
    echo "NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz"
    echo "NEXT_PUBLIC_MONAD_CHAIN_ID=10143"
    echo "NEXT_PUBLIC_CHAIN_NAME=Monad Testnet"
    echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:3002"
    echo ""
    
    # Offer to update automatically
    read -p "Would you like to update frontend/.env.local automatically? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=$MUSIC_NFT
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=$VOTING_CONTRACT
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
EOF
        echo "✅ frontend/.env.local updated!"
    fi
else
    echo ""
    echo "❌ Deployment failed or addresses not found in output"
    echo "Please check the error messages above"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Start backend:    cd backend && node server.js"
echo "2. Start frontend:   cd frontend && npm run dev"
echo "3. Open browser:     http://localhost:3001"
echo "4. Connect wallet to Monad Testnet"
echo ""
