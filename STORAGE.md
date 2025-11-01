# Storage Architecture - Local Backend (No IPFS)

## Overview

Replaced IPFS with a local Express.js backend for simpler, free storage.

## Components

### Backend Server (`/backend`)
- **Port**: 3002
- **Stack**: Express.js + Multer
- **Storage**: Local filesystem (`/backend/uploads`)

### Endpoints

```
POST /api/upload          - Upload audio file (MP3/WAV/MP4)
POST /api/metadata        - Store metadata JSON
GET  /api/files/:fileId   - Stream audio file
GET  /api/metadata/:id    - Get metadata
GET  /api/files           - List all files (debug)
GET  /health              - Health check
```

## Running the Application

### 1. Start Hardhat Node (Terminal 1)
```bash
cd /home/yuvrajs/Desktop/MonadFInal
npx hardhat node
```

### 2. Start Backend Server (Terminal 2)
```bash
cd /home/yuvrajs/Desktop/MonadFInal/backend
node server.js
```

### 3. Start Frontend (Terminal 3)
```bash
cd /home/yuvrajs/Desktop/MonadFInal/frontend
npm run dev
```

## Environment Variables

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_MONAD_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_MONAD_CHAIN_ID=1337
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
```

## Upload Flow

1. **User uploads audio file** → Frontend sends to `/api/upload`
2. **Backend saves file** → Returns `fileId`
3. **Frontend creates metadata** → Includes `fileId` as `audioHash`
4. **Metadata uploaded** → Backend stores, returns `metadataId`
5. **NFT minted** → Smart contract stores `metadataId` on-chain
6. **Playback** → Frontend fetches metadata, then streams audio via `/api/files/:fileId`

## Storage Location

- **Audio files**: `/backend/uploads/` (gitignored)
- **Metadata**: In-memory Map (replace with MongoDB for production)

## Advantages Over IPFS

✅ **Free** - No IPFS node or gateway costs
✅ **Fast** - Local storage, no network delays
✅ **Simple** - No IPFS setup required
✅ **Control** - Full control over files
✅ **Privacy** - Files not public by default

## Production Considerations

For production deployment:

1. **Use MongoDB** for metadata persistence
2. **Add AWS S3** or similar for file storage
3. **Add authentication** for upload endpoints
4. **Add file validation** and virus scanning
5. **Implement CDN** for better streaming
6. **Add backup strategy**

## Migration to MongoDB (Optional)

Install MongoDB:
```bash
npm install mongodb mongoose
```

Replace in-memory storage with:
```javascript
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/music-nft');
```
