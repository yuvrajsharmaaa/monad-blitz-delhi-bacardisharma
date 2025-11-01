#!/bin/bash

# Quick Start Script for Remix Battle System
# This script checks all services and provides status

set -e

echo "🎮 Remix Battle System - Quick Start"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if frontend is running
echo "Checking services..."
echo ""

if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✓ Frontend running on http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not running${NC}"
    echo "  Start with: cd frontend && npm run dev"
fi

if curl -s http://localhost:3002/health > /dev/null; then
    echo -e "${GREEN}✓ Backend running on http://localhost:3002${NC}"
else
    echo -e "${YELLOW}⚠ Backend not running (optional)${NC}"
    echo "  Start with: cd backend && node server.js"
fi

echo ""
echo "📋 Deployed Contract Addresses:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRIZE Token:     0x3d6aC5D3FFae950a03Ea6B14387895Ddc9E631A5"
echo "RemixBattle:     0xDC642fC6f697E524Ac4d8EFADD80C459297aa4B2"
echo "MusicNFT:        0x21D652731fd29111714D60d99b641d52aF8D1251"
echo "VotingContract:  0x1dE4545be0a494716153F1Adb505F629905159C3"
echo ""
echo "🌐 Network: Monad Testnet (Chain ID: 10143)"
echo "RPC: https://testnet-rpc.monad.xyz"
echo ""

echo "🎯 Quick Test Flow:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Open http://localhost:3001"
echo "2. Click '🏆 Remix Battles' tab"
echo "3. Connect MetaMask to Monad testnet"
echo "4. Click 'Claim 100 PRIZE' for test tokens"
echo "5. Click 'Create Battle' to start competition"
echo "6. Submit remixes and vote!"
echo ""

echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "• REMIX_BATTLE_GUIDE.md - Complete guide"
echo "• BATTLE_SYSTEM_COMPLETE.md - Implementation summary"
echo "• RUN_PROJECT.md - Development setup"
echo ""

echo "🚀 Ready to start your remix battle!"
echo ""
