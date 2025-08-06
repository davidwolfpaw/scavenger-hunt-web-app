// This file seeds the SQLite database with test data for users and tags.
// It is intended for use in a development environment and should not be used in production.
// The script connects to the SQLite database, inserts sample users and tags, and then closes the connection.
// To run this script, ensure you have Node.js installed and run the following command in your terminal:
// node scripts/seed-test-data.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/scavenger-hunt.db');
const db = new sqlite3.Database(dbPath);

// Sample users
const users = [
  { name: 'Omni', identifier: 'omni', is_admin: 1 },
  { name: 'BowieBarks', identifier: 'bowiebarks', is_admin: 1 },
  { name: 'Blitzen', identifier: 'blitzen', is_admin: 0 },
  { name: 'Patches', identifier: 'patches', is_admin: 0 },
  { name: 'Styxx', identifier: 'styxx', is_admin: 0 },
  { name: 'Fang', identifier: 'fang', is_admin: 0 },
  { name: 'Tristis', identifier: 'tristis', is_admin: 0 },
  { name: 'Royal', identifier: 'royal', is_admin: 0 },
  { name: 'PatPat', identifier: 'patpat', is_admin: 0 },
  { name: 'Artemis', identifier: 'artemis', is_admin: 0 }
];

// Sample tags
const tags = [
  { tag_id: 'bowie', label: 'Bowie' },
  { tag_id: 'glamour', label: 'Glamour' },
  { tag_id: 'lucian', label: 'Lucian' },
  { tag_id: 'pounce', label: 'Pounce' },
  { tag_id: 'sol', label: 'Sol' },
  { tag_id: 'trinket', label: 'Trinket' },
  { tag_id: 'typhon', label: 'Typhon' },
  { tag_id: 'ursula', label: 'Ursula' }
];

const scans = [
    // BowieBarks scanned 5 tags
    { user_id: 'bowiebarks', tag_id: 'bowie' },
    { user_id: 'bowiebarks', tag_id: 'glamour' },
    { user_id: 'bowiebarks', tag_id: 'lucian' },
    { user_id: 'bowiebarks', tag_id: 'typhon' },
    { user_id: 'bowiebarks', tag_id: 'ursula' },
    // Blitzen scanned 1 tag
    { user_id: 'blitzen', tag_id: 'sol' },
    // Tristis scanned 1 tag
    { user_id: 'tristis', tag_id: 'sol' },
    // Patches scanned 2 tags
    { user_id: 'patches', tag_id: 'trinket' },
    { user_id: 'patches', tag_id: 'typhon' },
    // Styxx scanned 0 tags (for completeness)
    // Fang scanned all tags
    { user_id: 'fang', tag_id: 'bowie' },
    { user_id: 'fang', tag_id: 'glamour' },
    { user_id: 'fang', tag_id: 'lucian' },
    { user_id: 'fang', tag_id: 'pounce' },
    { user_id: 'fang', tag_id: 'sol' },
    { user_id: 'fang', tag_id: 'trinket' },
    { user_id: 'fang', tag_id: 'typhon' },
    { user_id: 'fang', tag_id: 'ursula' },
    // Artemis scanned all tags
    { user_id: 'artemis', tag_id: 'bowie' },
    { user_id: 'artemis', tag_id: 'glamour' },
    { user_id: 'artemis', tag_id: 'lucian' },
    { user_id: 'artemis', tag_id: 'pounce' },
    { user_id: 'artemis', tag_id: 'sol' },
    { user_id: 'artemis', tag_id: 'trinket' },
    { user_id: 'artemis', tag_id: 'typhon' },
    { user_id: 'artemis', tag_id: 'ursula' }
];

db.serialize(() => {
  console.log('Seeding test users...');
  users.forEach(user => {
    db.run(
      `INSERT OR IGNORE INTO users (name, identifier, is_admin) VALUES (?, ?, ?)`,
      [user.name, user.identifier, user.is_admin],
      err => err && console.error('User insert error:', err)
    );
  });

  console.log('Seeding test tags...');
  tags.forEach(tag => {
    db.run(
      `INSERT OR IGNORE INTO tags (tag_id, label) VALUES (?, ?)`,
      [tag.tag_id, tag.label],
      err => err && console.error('Tag insert error:', err)
    );
  });

  console.log('Seeding test scans...');
  let pendingScans = scans.length;
  if (pendingScans === 0) {
    db.close(() => {
      console.log('Database seed complete!');
    });
  }
  scans.forEach(scan => {
    db.get(
      `SELECT id FROM users WHERE identifier = ?`,
      [scan.user_id],
      (err, userRow) => {
        if (err || !userRow) {
          console.error('User lookup error:', err || 'User not found for scan:', scan);
          pendingScans--;
          if (pendingScans === 0) {
            db.close(() => {
              console.log('Database seed complete!');
            });
          }
          return;
        }
        db.run(
            `INSERT OR IGNORE INTO scans (user_id, tag_id) VALUES (?, ?)`,
            [userRow.id, scan.tag_id],
            err => {
            if (err) console.error('Scan insert error:', err);
            pendingScans--;
            if (pendingScans === 0) {
                db.close(() => {
                console.log('Database seed complete!');
                });
            }
            }
        );
      }
    );
  });
});
