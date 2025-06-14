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
  { name: 'Wonder Woman', identifier: 'alice123', is_admin: 1 },
  { name: 'Batman', identifier: 'bob456', is_admin: 0 },
  { name: 'Aquaman', identifier: 'charlie789', is_admin: 0 }
];

// Sample tags
const tags = [
  { tag_id: 'batcave', label: 'Batcave' },
  { tag_id: 'daily-planet', label: 'Daily Planet' },
  { tag_id: 'titans-tower', label: 'Titans Tower' },
  { tag_id: 'fortress-of-solitude', label: 'Fortress of Solitude' },
  { tag_id: 'hall-of-justice', label: 'Hall of Justice' }
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
});

db.close(() => {
  console.log('Database seed complete!');
});
