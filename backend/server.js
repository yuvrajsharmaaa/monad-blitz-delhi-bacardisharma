const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|mp4|mpeg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, MP4) are allowed'));
    }
  }
});

// Create data directory for tracks metadata
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const tracksFile = path.join(dataDir, 'tracks.json');

// Initialize tracks file if it doesn't exist
if (!fs.existsSync(tracksFile)) {
  fs.writeFileSync(tracksFile, JSON.stringify({ tracks: [] }, null, 2));
}

// Helper functions
function loadTracks() {
  try {
    const data = fs.readFileSync(tracksFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading tracks:', error);
    return { tracks: [] };
  }
}

function saveTracks(data) {
  try {
    fs.writeFileSync(tracksFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving tracks:', error);
  }
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Upload track with metadata
app.post('/api/tracks', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, artist, parentId, onChainTrackId } = req.body;

    const track = {
      id: Date.now().toString(),
      title: title || 'Untitled',
      description: description || '',
      artist: artist || 'Unknown',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl: `http://localhost:${PORT}/api/files/${req.file.filename}`,
      parentId: parentId || null,
      onChainTrackId: onChainTrackId || null,
      voteCount: 0,
      createdAt: new Date().toISOString(),
    };

    const data = loadTracks();
    data.tracks.push(track);
    saveTracks(data);

    console.log(`✅ Track uploaded: ${track.title} by ${track.artist}`);
    if (parentId) {
      console.log(`   └─ Remix of track ${parentId}`);
    }

    res.json({
      success: true,
      track
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tracks
app.get('/api/tracks', (req, res) => {
  try {
    const data = loadTracks();
    res.json({ tracks: data.tracks });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single track
app.get('/api/tracks/:id', (req, res) => {
  try {
    const data = loadTracks();
    const track = data.tracks.find(t => t.id === req.params.id);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json({ track });
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update track vote count
app.patch('/api/tracks/:id/vote', (req, res) => {
  try {
    const data = loadTracks();
    const track = data.tracks.find(t => t.id === req.params.id);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    track.voteCount = (track.voteCount || 0) + 1;
    saveTracks(data);

    res.json({ success: true, voteCount: track.voteCount });
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload metadata
app.post('/api/metadata', (req, res) => {
  try {
    const metadataObj = req.body;
    
    if (!metadataObj || typeof metadataObj !== 'object') {
      return res.status(400).json({ error: 'Invalid metadata' });
    }

    // Generate unique metadata ID
    const metadataId = Date.now() + '-' + Math.round(Math.random() * 1E9);
    metadata.set(metadataId, metadataObj);

    res.json({
      success: true,
      metadataId,
      metadataUrl: `/api/metadata/${metadataId}`
    });
  } catch (error) {
    console.error('Metadata upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get metadata by ID
app.get('/api/metadata/:id', (req, res) => {
  try {
    const { id } = req.params;
    const metadataObj = metadata.get(id);

    if (!metadataObj) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    res.json(metadataObj);
  } catch (error) {
    console.error('Metadata fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve audio files
app.get('/api/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all uploaded files (for debugging)
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Files will be stored in: ${uploadsDir}`);
  console.log(`✅ Ready to accept uploads\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});
