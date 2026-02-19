// This file seeds the SQLite database with test data for users and tags.
// It is intended for use in a development environment and should not be used in production.
// The script connects to the SQLite database, inserts sample users and tags, and then closes the connection.
// To run this script, ensure you have Node.js installed and run the following command in your terminal:
// node scripts/seed-test-data.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../database/scavenger-hunt.db");
const db = new sqlite3.Database(dbPath);

// Sample users
const users = [
  { name: "Avery", identifier: "omni", is_admin: 1 },
  { name: "Bowie", identifier: "bowiebarks", is_admin: 1 },
  { name: "Charlie", identifier: "blitzen", is_admin: 0 },
  { name: "Devan", identifier: "patches", is_admin: 0 },
  { name: "Harley", identifier: "styxx", is_admin: 0 },
  { name: "Kai", identifier: "fang", is_admin: 0 },
  { name: "Lake", identifier: "tristis", is_admin: 0 },
  { name: "Rowan", identifier: "royal", is_admin: 0 },
  { name: "Tai", identifier: "patpat", is_admin: 0 },
  { name: "Winter", identifier: "artemis", is_admin: 0 },
];

// Sample tags
const tags = [
  { tag_id: "vhztq3sf", label: "Bowie" },
  { tag_id: "bb0aw6m4", label: "Glamour" },
  { tag_id: "6723jyuk", label: "Lucian" },
  { tag_id: "tfws176b", label: "Pounce" },
  { tag_id: "qspif7ke", label: "Sol" },
  { tag_id: "ttvjpg71", label: "Trinket" },
  { tag_id: "ppqj5pvo", label: "Typhon" },
  { tag_id: "8012057x", label: "Ursula" },
];

const scans = [];

db.serialize(() => {
  console.log("Seeding test users...");
  users.forEach((user) => {
    db.run(
      `INSERT OR IGNORE INTO users (name, identifier, is_admin) VALUES (?, ?, ?)`,
      [user.name, user.identifier, user.is_admin],
      (err) => err && console.error("User insert error:", err),
    );
  });

  console.log("Seeding test tags...");
  tags.forEach((tag) => {
    db.run(
      `INSERT OR IGNORE INTO tags (tag_id, label) VALUES (?, ?)`,
      [tag.tag_id, tag.label],
      (err) => err && console.error("Tag insert error:", err),
    );
  });

  console.log("Seeding test scans...");
  let pendingScans = scans.length;
  if (pendingScans === 0) {
    db.close(() => {
      console.log("Database seed complete!");
    });
  }
  scans.forEach((scan) => {
    if (scan.for_date) {
      db.run(
        `INSERT OR IGNORE INTO scans (user_id, tag_id, for_date) VALUES (?, ?, ?)`,
        [scan.user_id, scan.tag_id, scan.for_date],
        (err) => {
          if (err) console.error("Scan insert error:", err);
          pendingScans--;
          if (pendingScans === 0) {
            db.close(() => {
              console.log("Database seed complete!");
            });
          }
        },
      );
    } else {
      db.run(
        `INSERT OR IGNORE INTO scans (user_id, tag_id) VALUES (?, ?)`,
        [scan.user_id, scan.tag_id],
        (err) => {
          if (err) console.error("Scan insert error:", err);
          pendingScans--;
          if (pendingScans === 0) {
            db.close(() => {
              console.log("Database seed complete!");
            });
          }
        },
      );
    }
  });
});
