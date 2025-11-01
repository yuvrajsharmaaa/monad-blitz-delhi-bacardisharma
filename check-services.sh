#!/bin/bash
# Quick Start Script for Music NFT Platform
# Run this to check service status

echo "🔍 Checking Service Status..."
echo ""

# Check Hardhat Node
echo "1️⃣  Hardhat Blockchain (Port 8545):"
if lsof -i :8545 2>/dev/null | grep -q LISTEN; then
    echo "   ✅ RUNNING"
    curl -s -X POST -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
      http://127.0.0.1:8545 | grep -q result && echo "   ✅ Responding to RPC calls"
else
    echo "   ❌ NOT RUNNING"
    echo "   Start with: cd /home/yuvrajs/Desktop/MonadFInal && npx hardhat node"
fi
echo ""

# Check Backend Server
echo "2️⃣  Backend Server (Port 3002):"
if lsof -i :3002 2>/dev/null | grep -q LISTEN; then
    echo "   ✅ RUNNING"
    curl -s http://localhost:3002/health | grep -q OK && echo "   ✅ Health check passed"
else
    echo "   ❌ NOT RUNNING"
    echo "   Start with: cd /home/yuvrajs/Desktop/MonadFInal/backend && node server.js"
fi
echo ""

# Check Frontend
echo "3️⃣  Frontend (Port 3001):"
if lsof -i :3001 2>/dev/null | grep -q LISTEN; then
    echo "   ✅ RUNNING"
else
    echo "   ❌ NOT RUNNING"  
    echo "   Start with: cd /home/yuvrajs/Desktop/MonadFInal/frontend && npm run dev"
fi
echo ""

# Summary
HARDHAT=$(lsof -i :8545 2>/dev/null | grep -q LISTEN && echo "1" || echo "0")
BACKEND=$(lsof -i :3002 2>/dev/null | grep -q LISTEN && echo "1" || echo "0")
FRONTEND=$(lsof -i :3001 2>/dev/null | grep -q LISTEN && echo "1" || echo "0")
TOTAL=$((HARDHAT + BACKEND + FRONTEND))

echo "📊 Summary: $TOTAL/3 services running"
if [ $TOTAL -eq 3 ]; then
    echo "🎉 All systems GO! Open http://localhost:3001"
else
    echo "⚠️  Some services are missing. Start them in separate terminal windows."
fi
