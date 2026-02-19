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
  { name: "Avery", identifier: "avery", is_admin: 1 },
  { name: "Bowie", identifier: "bowie", is_admin: 1 },
  { name: "Charlie", identifier: "charlie", is_admin: 0 },
  { name: "Devan", identifier: "devan", is_admin: 0 },
  { name: "Harley", identifier: "harley", is_admin: 0 },
  { name: "Kai", identifier: "kai", is_admin: 0 },
  { name: "Lake", identifier: "lake", is_admin: 0 },
  { name: "Rowan", identifier: "rowan", is_admin: 0 },
  { name: "Tai", identifier: "tai", is_admin: 0 },
  { name: "Winter", identifier: "winter", is_admin: 0 },
];

// Sample tags
const tags = [
  { tag_id: "vhztq3sf", label: "Kitchen" },
  { tag_id: "bb0aw6m4", label: "Ballroom" },
  { tag_id: "6723jyuk", label: "Conservatory" },
  { tag_id: "tfws176b", label: "Billiard Room" },
  { tag_id: "qspif7ke", label: "Library" },
  { tag_id: "ttvjpg71", label: "Study" },
  { tag_id: "ppqj5pvo", label: "Hall" },
  { tag_id: "8012057x", label: "Lounge" },
];

// Scans use the identifier as user_id and the tag's tag_id.
// Omitting for_date uses the table default: date('now', '-4 hours') (today's event date).
const scans = [
  // charlie — scanned all 8 tags (first completer)
  { user_id: "charlie", tag_id: "vhztq3sf" },
  { user_id: "charlie", tag_id: "bb0aw6m4" },
  { user_id: "charlie", tag_id: "6723jyuk" },
  { user_id: "charlie", tag_id: "tfws176b" },
  { user_id: "charlie", tag_id: "qspif7ke" },
  { user_id: "charlie", tag_id: "ttvjpg71" },
  { user_id: "charlie", tag_id: "ppqj5pvo" },
  { user_id: "charlie", tag_id: "8012057x" },

  // devan — scanned all 8 tags (second completer)
  { user_id: "devan", tag_id: "vhztq3sf" },
  { user_id: "devan", tag_id: "bb0aw6m4" },
  { user_id: "devan", tag_id: "6723jyuk" },
  { user_id: "devan", tag_id: "tfws176b" },
  { user_id: "devan", tag_id: "qspif7ke" },
  { user_id: "devan", tag_id: "ttvjpg71" },
  { user_id: "devan", tag_id: "ppqj5pvo" },
  { user_id: "devan", tag_id: "8012057x" },

  // tai — 7 of 8 tags (missing Lounge)
  { user_id: "tai", tag_id: "vhztq3sf" },
  { user_id: "tai", tag_id: "bb0aw6m4" },
  { user_id: "tai", tag_id: "6723jyuk" },
  { user_id: "tai", tag_id: "tfws176b" },
  { user_id: "tai", tag_id: "qspif7ke" },
  { user_id: "tai", tag_id: "ttvjpg71" },
  { user_id: "tai", tag_id: "ppqj5pvo" },

  // harley — 5 of 8 tags
  { user_id: "harley", tag_id: "vhztq3sf" },
  { user_id: "harley", tag_id: "bb0aw6m4" },
  { user_id: "harley", tag_id: "6723jyuk" },
  { user_id: "harley", tag_id: "tfws176b" },
  { user_id: "harley", tag_id: "qspif7ke" },

  // kai — 3 of 8 tags
  { user_id: "kai", tag_id: "vhztq3sf" },
  { user_id: "kai", tag_id: "ttvjpg71" },
  { user_id: "kai", tag_id: "ppqj5pvo" },

  // winter — 2 of 8 tags
  { user_id: "winter", tag_id: "bb0aw6m4" },
  { user_id: "winter", tag_id: "qspif7ke" },

  // lake — 1 of 8 tags
  { user_id: "lake", tag_id: "8012057x" },

  // rowan — no scans (intentionally absent from this list)
];

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
