const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/scavenger-hunt.db');
const db = new sqlite3.Database(dbPath);

function getDb() {
  return new sqlite3.Database(dbPath);
}

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      identifier TEXT UNIQUE NOT NULL,
      is_admin INTEGER DEFAULT 0
    )
  `);

  // Scans table
  db.run(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tag_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, tag_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_id TEXT UNIQUE NOT NULL,
      label TEXT
    )
  `);
});

function registerUser(name, identifier, callback) {
  const db = getDb();
  db.run(
    `INSERT INTO users (name, identifier) VALUES (?, ?)`,
    [name, identifier],
    function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, this.lastID);
    }
  );
}

function findUserByIdentifier(identifier, callback) {
  db.get(`SELECT * FROM users WHERE identifier = ?`, [identifier], callback);
}

function findUsernameByIdentifier(identifier, callback) {
  db.get(`SELECT name FROM users WHERE identifier = ?`, [identifier], (err, row) => {
    if (err) return callback(err);
    callback(null, row ? row.name : null);
  });
}

function findUserByNameAndIdentifier(name, identifier, callback) {
  const sqlite3 = require('sqlite3').verbose();
  const dbInstance = new sqlite3.Database(path.resolve(__dirname, '../database/scavenger-hunt.db'));

  dbInstance.get(
    `SELECT * FROM users WHERE name = ? AND identifier = ?`,
    [name, identifier],
    (err, row) => {
      if (err) return callback(err);
      callback(null, row);
    }
  );
}

function logScan(userId, tagId, callback) {
  const stmt = db.prepare(`INSERT OR IGNORE INTO scans (user_id, tag_id) VALUES (?, ?)`);
  stmt.run(userId, tagId, function (err) {
    callback(err, this?.changes > 0); // true if new row added
  });
}

function getUserScans(userId, callback) {
  db.all(`SELECT tag_id, timestamp FROM scans WHERE user_id = ?`, [userId], callback);
}

function addTag(tag_id, label = null, callback) {
  db.run(`INSERT OR IGNORE INTO tags (tag_id, label) VALUES (?, ?)`, [tag_id, label], callback);
}

function getAllTags(callback) {
  db.all(`SELECT tag_id, label FROM tags ORDER BY tag_id`, [], callback);
}

function tagExists(tag_id, callback) {
  db.get(`SELECT id FROM tags WHERE tag_id = ?`, [tag_id], callback);
}

module.exports = {
  db,
  registerUser,
  findUserByIdentifier,
  findUsernameByIdentifier,
  findUserByNameAndIdentifier,
  logScan,
  getUserScans,
  addTag,
  getAllTags,
  tagExists,
};
