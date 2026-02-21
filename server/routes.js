require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const crypto = require("crypto");
const router = express.Router();
const db = require("./db");

const SECRET_KEY = process.env.SECRET_KEY || "your_jwt_secret_key";

function getHostBaseUrl() {
  // Ensure PUBLIC_URL is loaded from .env and fallback only if not set
  let baseUrl = process.env.PUBLIC_URL ?? "";
  if (baseUrl.trim() === "") {
    baseUrl = "http://localhost";
  }
  const port = parseInt(process.env.PORT ?? "80");

  //  if(port !== 80 && port !== 443){
  //      baseUrl = `${baseUrl}:${port}`;
  //  }

  return baseUrl;
}

// Register a new user
router.post("/register", async (req, res) => {
  const { name, identifier } = req.body;
  if (!name || !identifier) {
    return res.status(400).json({ error: "Name and identifier are required" });
  }

  try {
    const user = await db.registerUser(name, identifier);
    res.json({ success: true, userId: user });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Identifier already taken or error saving user" });
  }
});

// Handle login
router.post("/login", async (req, res) => {
  const { name, identifier } = req.body;

  if (!name || !identifier) {
    return res
      .status(400)
      .json({ success: false, error: "Name and identifier are required" });
  }

  const user = await db.findUserByIdentifier(identifier);

  if (!user || user.name.toLowerCase() !== name.toLowerCase()) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { identifier: user.identifier, isAdmin: user.is_admin, name: user.name },
    SECRET_KEY,
    { expiresIn: "4 weeks" },
  );

  res.json({
    success: true,
    token,
    isAdmin: user.is_admin,
    identifier: user.identifier,
  });
});

// Log a scan
router.post("/scan", async (req, res) => {
  try {
    const { identifier, tagId } = req.body;

    if (!identifier || !tagId)
      return res
        .status(400)
        .json({ error: "Identifier and tagId are required" });

    const tag = await db.tagExists(tagId);

    if (!tag) return res.status(400).json({ error: "Unknown tag ID" });

    const user = await db.findUserByIdentifier(identifier);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const added = await db.logScan(user.identifier, tagId);

    res.json({ success: true, alreadyScanned: !added });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to log tag scan" });
  }
});

// Get scans for a user
router.get("/scans/:identifier", async (req, res) => {
  const { identifier } = req.params;
  const user = await db.findUserByIdentifier(identifier);

  if (!user) return res.status(404).json({ error: "User not found" });

  const [scans, required] = await Promise.all([
    db.getUserScans(user.identifier),
    db.getTagsCount(),
  ]);

  res.json({ success: true, scans, required });
});

// Get current username by identifier
router.get("/user/:identifier", async (req, res) => {
  const { identifier } = req.params;
  const user = await db.findUsernameByIdentifier(identifier);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ success: true, name: user.name });
});

// Check if a user has completed the scavenger hunt
router.get("/user/:identifier/completion", async (req, res) => {
  const { identifier } = req.params;

  const user = await db.findUserByIdentifier(identifier);

  if (!user)
    return res.status(404).json({ success: false, error: "User not found" });

  // Check if the user has completed the scavenger hunt
  const scans = await db.getUserScans(user.identifier);

  // Assuming getAllTags returns the total number of tags
  const tags = await db.getAllTags();

  if (scans.length !== tags.length) {
    return res.status(200).json({
      success: true,
      completed: false,
      scans,
      name: user.name,
      message: "Keep going! You have not completed the scavenger hunt yet.",
    });
  }

  res.status(200).json({
    success: true,
    completed: true,
    scans,
    name: user.name,
    message: "Congratulations! You have completed the scavenger hunt.",
  });
});

// Verify a completion code
router.get("/user/:identifier/verify", async (req, res) => {
  const { identifier } = req.params;

  const user = await db.findUsernameByIdentifier(identifier);

  if (!user)
    return res
      .status(404)
      .json({ success: false, error: "User does not exist" });

  const url = `${getHostBaseUrl()}/verify.html?user=${encodeURIComponent(identifier)}`;
  const qr = await QRCode.toDataURL(url);

  res.json({
    success: true,
    message: "This code verifies a completed scavenger hunt!",
    qr,
  });
});

// Admin: List all users
router.get("/admin/users", adminAuth, async (req, res) => {
  // First get total number of tags
  const totalTags = await db.getTagsCount();

  // Get users along with their scan count
  const userScans = await db.getUserScanCount();

  // Add a marker for users who have scanned all tags
  const usersWithMarkers = userScans.map((user) => ({
    ...user,
    hasScannedAll: user.scan_count === totalTags,
  }));

  res.json({ success: true, users: usersWithMarkers });
});

// Admin: Tags + QR codes
router.get("/admin/tags-with-codes", adminAuth, async (req, res) => {
  const tags = await db.getAllTags();

  // Ensure PUBLIC_URL is loaded from .env and fallback only if not set
  let baseUrl = process.env.PUBLIC_URL ?? "";
  if (baseUrl.trim() === "") {
    baseUrl = "http://localhost:3000";
  }

  const enriched = await Promise.all(
    tags.map(async (tag) => {
      const url = `${getHostBaseUrl()}/scan.html?tag=${encodeURIComponent(tag.tag_id)}`;
      const qr = await QRCode.toDataURL(url);
      return { ...tag, url, qr };
    }),
  );

  res.json({ success: true, tags: enriched });
});

// Admin: Scans by clue
router.get("/admin/scans-by-clue", adminAuth, async (req, res) => {
  const clues = await db.getScansByClue();

  res.json({ success: true, clues });
});

// Admin: First to complete
router.get("/admin/first-complete", adminAuth, async (req, res) => {
  const firstComplete = await db.getFirstComplete();

  res.json({ success: true, firstComplete });
});

// Admin: Get scans for a specific user
router.get("/admin/user/:identifier/scans", adminAuth, async (req, res) => {
  const { identifier } = req.params;

  const user = await db.findUserByIdentifier(identifier);

  if (!user)
    return res.status(404).json({ success: false, error: "User not found" });

  const scans = await db.getUserScans(user.id);

  res.json({ success: true, scans });
});

// Admin: Generate token for allowed user
function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token)
    return res
      .status(401)
      .json({ success: false, error: "Unauthorized - No Token" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || !decoded.isAdmin) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized Key" });
    }
    next();
  });
}

// Function to generate a unique completion code
function generateCompletionCode() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = router;
