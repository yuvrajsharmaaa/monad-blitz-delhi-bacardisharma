#!/bin/bash

# Start Hardhat node in background
echo "Starting Hardhat node..."
cd /home/yuvrajs/Desktop/MonadFInal
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!
echo "Hardhat node started (PID: $HARDHAT_PID)"

# Wait for Hardhat to start
sleep 3

# Deploy contracts
echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Start backend server
echo "Starting backend server..."
cd /home/yuvrajs/Desktop/MonadFInal/backend
node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend server started (PID: $BACKEND_PID)"

# Start frontend
echo "Starting frontend..."
cd /home/yuvrajs/Desktop/MonadFInal/frontend
npm run dev

# Cleanup on exit
trap "kill $HARDHAT_PID $BACKEND_PID 2>/dev/null" EXIT
