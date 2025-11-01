#!/bin/bash

echo "🔑 Setting up Private Key for Monad Testnet Deployment"
echo "======================================================"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   - Only use a testnet wallet (NOT your mainnet wallet)"
echo "   - Never share your private key with anyone"
echo "   - The .env file is in .gitignore and won't be committed"
echo ""
echo "📋 Steps to get your private key from MetaMask:"
echo ""
echo "   1. Open MetaMask extension"
echo "   2. Click the three dots (•••) next to your account"
echo "   3. Select 'Account Details'"
echo "   4. Click 'Show Private Key'"
echo "   5. Enter your MetaMask password"
echo "   6. Click to reveal and copy your private key"
echo ""
echo "💰 Before deploying, make sure you have testnet tokens:"
echo "   Visit: https://faucet.monad.xyz/"
echo "   Request testnet MON tokens for your wallet address"
echo ""
echo "✏️  Now, let's update your .env file..."
echo ""

# Ask if user wants to continue
read -p "Do you have your private key ready? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled. Get your private key first, then run this script again."
    exit 1
fi

# Get private key from user
echo ""
echo "Paste your private key (without 0x prefix):"
read -s PRIVATE_KEY
echo ""

# Validate private key format (should be 64 hex characters)
PRIVATE_KEY_CLEAN=$(echo "$PRIVATE_KEY" | sed 's/^0x//' | tr -d '[:space:]')

if [ ${#PRIVATE_KEY_CLEAN} -ne 64 ]; then
    echo "❌ Error: Private key should be 64 characters (32 bytes in hex)"
    echo "   Your input was ${#PRIVATE_KEY_CLEAN} characters"
    echo "   Please try again with the correct private key"
    exit 1
fi

# Check if it's the placeholder
if [ "$PRIVATE_KEY_CLEAN" == "your_private_key_here_without_0x_prefix" ]; then
    echo "❌ Error: Please use your actual private key, not the placeholder"
    exit 1
fi

# Update .env file
cat > .env << EOF
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRIVATE_KEY=$PRIVATE_KEY_CLEAN
EOF

echo "✅ Private key saved to .env file"
echo ""
echo "🎯 Next steps:"
echo ""
echo "   1. Make sure you have testnet tokens: https://faucet.monad.xyz/"
echo "   2. Deploy contracts: ./deploy-monad.sh"
echo ""
echo "Or deploy manually:"
echo "   npx hardhat run scripts/deploy.js --network monad"
echo ""
