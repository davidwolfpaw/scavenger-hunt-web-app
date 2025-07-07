require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const path = require('path');
const router = express.Router();
const db = require('./db');

const SECRET_KEY = process.env.SECRET_KEY || 'your_jwt_secret_key';

// Register a new user
router.post('/register', (req, res) => {
  const { name, identifier } = req.body;
  if (!name || !identifier) {
    return res.status(400).json({ error: 'Name and identifier are required' });
  }

  db.registerUser(name, identifier, (err, userId) => {
    if (err) {
      return res.status(500).json({ error: 'Identifier already taken or error saving user' });
    }
    res.json({ success: true, userId });
  });
});

// Handle login
router.post('/login', (req, res) => {
  const { name, identifier } = req.body;

  if (!name || !identifier) {
    return res.status(400).json({ success: false, error: 'Name and Identifier are required' });
  }

  db.findUserByNameAndIdentifier(name, identifier, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if the user is an admin
    if (user.is_admin) {
        // Generate a token for admin
        const token = jwt.sign({ id: user.id, isAdmin: true }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ success: true, isAdmin: true, token });
    } else {
        res.json({ success: true, isAdmin: false });
    }
  });
});

// Log a scan
router.post('/scan', (req, res) => {
  const { identifier, tagId } = req.body;

  db.tagExists(tagId, (err, tagRow) => {
    if (err || !tagRow) return res.status(400).json({ error: 'Unknown tag ID' });
    if (!identifier || !tagId) return res.status(400).json({ error: 'Identifier and tagId are required' });

    db.findUserByIdentifier(identifier, (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      db.logScan(user.id, tagId, (err, added) => {
        if (err) return res.status(500).json({ error: 'Failed to log scan' });
          res.json({ success: true, alreadyScanned: !added });
      });
    });
  });
});

// Get scans for a user
router.get('/scans/:identifier', (req, res) => {
  const { identifier } = req.params;
  db.findUserByIdentifier(identifier, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    db.getUserScans(user.id, (err, scans) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch scans' });
      res.json({ success: true, scans });
    });
  });
});

// Get current username by identifier
router.get('/user/:identifier', (req, res) => {
  const { identifier } = req.params;
  findUsernameByIdentifier(identifier, (err, name) => {
    if (err || !name) return res.status(404).json({ error: 'User not found' });
      res.json({ success: true, name });
  });
});

// Admin: List all users
router.get('/admin/users', adminAuth, (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const dbInstance = new sqlite3.Database(path.resolve(__dirname, '../database/scavenger-hunt.db'));

  // First get total number of tags
  getTotalTags((err, totalTags) => {
    if (err) return res.status(500).json({ success: false, error: 'DB error' });

    // Get users along with their scan count
    const query = `
      SELECT u.id, u.name, u.identifier, COUNT(s.tag_id) as scan_count
      FROM users u
      LEFT JOIN scans s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY u.name
    `;

    dbInstance.all(query, [], (err, users) => {
      if (err) return res.status(500).json({ success: false, error: 'DB error' });

      // Add a marker for users who have scanned all tags
      const usersWithMarkers = users.map(user => ({
        ...user,
        hasScannedAll: user.scan_count === totalTags
      }));

      res.json({ success: true, users: usersWithMarkers });
    });
  });
});

// Admin: Tags + QR codes
router.get('/admin/tags-with-codes', adminAuth, async (req, res) => {
  db.getAllTags(async (err, tags) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const enriched = await Promise.all(tags.map(async tag => {
      const url = `${baseUrl}/scan.html?tag=${encodeURIComponent(tag.tag_id)}`;
      const qr = await QRCode.toDataURL(url);
      return { ...tag, url, qr };
    }));

    res.json({ success: true, tags: enriched });
  });
});

// Admin: Get scans for a specific user
router.get('/admin/user/:identifier/scans', adminAuth, (req, res) => {
  const { identifier } = req.params;

  db.findUserByIdentifier(identifier, (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, error: 'User not found' });

    db.getUserScans(user.id, (err, scans) => {
      if (err) return res.status(500).json({ success: false, error: 'Failed to fetch scans' });

      // Assuming scans is an array of { tag_id, timestamp }
      res.json({ success: true, scans });
    });
  });
});

// Admin: Generate token for allowed user
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized - No Token'  });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || !decoded.isAdmin) return res.status(401).json({ success: false, error: 'Unauthorized Key' });
    next();
   });
}

// Function to find username by identifier
function findUsernameByIdentifier(identifier, callback) {
  db.findUserByIdentifier(identifier, (err, user) => {
    if (err || !user) return callback(err || new Error('User not found'));
    callback(null, user.name);
  });
}

// Function to get the total number of tags
function getTotalTags(callback) {
  db.getAllTags((err, tags) => {
    if (err) return callback(err);
    callback(null, tags.length);
  });
}

module.exports = router;
