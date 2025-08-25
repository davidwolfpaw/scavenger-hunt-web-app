require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');
const router = express.Router();
const db = require('./db');

const SECRET_KEY = process.env.SECRET_KEY || 'your_jwt_secret_key';

// Register a new user
router.post('/register', async (req, res) => {
    const { name, identifier } = req.body;
    if (!name || !identifier) {
        return res.status(400).json({ error: 'Name and identifier are required' });
    }

    try{
        const user = await db.registerUser(name, identifier);
        res.json({ success: true, userId: user });
    }catch(e){

        return res.status(500).json({ error: 'Identifier already taken or error saving user' });
    }
    
});

// Handle login
router.post('/login', async (req, res) => {
    const { name, identifier } = req.body;

    if (!name || !identifier) {
        return res.status(400).json({ success: false, error: 'Name and Identifier are required' });
    }

    const user = await db.findUserByIdentifier(identifier);

    if (!user) {
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

// Log a scan
router.post('/scan', async (req, res) => {
    try {

        const { identifier, tagId } = req.body;

        if (!identifier || !tagId)
            return res.status(400).json({ error: 'Identifier and tagId are required' });

        const tag = await db.tagExists(tagId);

        if (!tag)
            return res.status(400).json({ error: 'Unknown tag ID' });


        const user = await db.findUserByIdentifier(identifier);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const added = await db.logScan(user.identifier, tagId);

        res.json({ success: true, alreadyScanned: !added });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to log tag scan" });
    }
});

// Get scans for a user
router.get('/scans/:identifier', async (req, res) => {
    const { identifier } = req.params;
    const user = await db.findUserByIdentifier(identifier);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const scans = await db.getUserScans(user.identifier);

    res.json({ success: true, scans });
});

// Get current username by identifier
router.get('/user/:identifier', async (req, res) => {
    const { identifier } = req.params;
    const user = await db.findUsernameByIdentifier(identifier);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, name: user.name });
});

// Check if a user has completed the scavenger hunt
router.get('/user/:identifier/completion', async (req, res) => {
    const { identifier } = req.params;

    const user = await db.findUserByIdentifier(identifier);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Check if the user has completed the scavenger hunt
    const scans = await db.getUserScans(user.id);

    // Assuming getAllTags returns the total number of tags
    const tags = await db.getAllTags()
    //if (err) return res.status(500).json({ success: false, error: 'Failed to fetch tags' });

    if (scans.length === tags.length) {
        // User has completed the scavenger hunt
        if (!user.completion_code) {
            // Generate a new completion code if not already generated
            const completionCode = generateCompletionCode();
            await db.setUserCompletionCode(user.identifier, completionCode);

            user.completion_code = completionCode;
        }

        // Generate QR code from existing completion code
        const qrCode = await QRCode.toDataURL(user.completion_code)

        res.json({ success: true, completed: true, qrCode, message: 'Congratulations! You have completed the scavenger hunt.' });

    } else {
        res.json({ success: true, completed: false, message: 'Keep going! You have not completed the scavenger hunt yet.' });
    }
});

// Verify a completion code
router.get('/verify-completion/:code', async (req, res) => {
    const { code } = req.params;

    const user = await db.getUserByCode(code);

    if (!user) return res.status(404).json({ success: false, error: 'Invalid or expired completion code' });

    res.json({ success: true, message: 'This code verifies a completed scavenger hunt!' });
});

// Admin: List all users
router.get('/admin/users', adminAuth, async (req, res) => {

    // First get total number of tags
    const totalTags = await db.getTagsCount();

    // Get users along with their scan count
    const userScans = await db.getUserScanCount();

    // Add a marker for users who have scanned all tags
    const usersWithMarkers = userScans.map(user => ({
        ...user,
        hasScannedAll: user.scan_count === totalTags
    }));

    res.json({ success: true, users: usersWithMarkers });
});

// Admin: Tags + QR codes
router.get('/admin/tags-with-codes', adminAuth, async (req, res) => {
    const tags = await db.getAllTags();

    // Ensure PUBLIC_URL is loaded from .env and fallback only if not set
    let baseUrl = process.env.PUBLIC_URL ?? '';
    if(baseUrl.trim() === ''){
        baseUrl = 'http://localhost:3000';
    }

    const enriched = await Promise.all(tags.map(async tag => {
        const url = `${baseUrl}/scan.html?tag=${encodeURIComponent(tag.tag_id)}`;
        const qr = await QRCode.toDataURL(url);
        return { ...tag, url, qr };
    }));

    res.json({ success: true, tags: enriched });
});

// Admin: Scans by clue
router.get('/admin/scans-by-clue', adminAuth, async (req, res) => {
    const clues = await db.getScansByClue();

    res.json({ success: true, clues });
});

// Admin: First to complete
router.get('/admin/first-complete', adminAuth, async (req, res) => {
    const firstComplete = await db.getFirstComplete()

    res.json({ success: true, firstComplete });
});

// Admin: Get scans for a specific user
router.get('/admin/user/:identifier/scans', adminAuth, async (req, res) => {
    const { identifier } = req.params;

    const user = await db.findUserByIdentifier(identifier)

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const scans = await db.getUserScans(user.id);

    res.json({ success: true, scans });
});

// Admin: Generate token for allowed user
function adminAuth(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized - No Token' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !decoded.isAdmin) {
            return res.status(401).json({ success: false, error: 'Unauthorized Key' });
        }
        next();
    });
}


// Function to generate a unique completion code
function generateCompletionCode() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = router;
