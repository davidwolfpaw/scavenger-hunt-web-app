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
  { name: 'SQRL', identifier: 'sqrl3', is_admin: 1 },
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
  { tag_id: 'vhztq3sf', label: 'Bowie' },
  { tag_id: 'bb0aw6m4', label: 'Glamour' },
  { tag_id: '6723jyuk', label: 'Lucian' },
  { tag_id: 'tfws176b', label: 'Pounce' },
  { tag_id: 'qspif7ke', label: 'Sol' },
  { tag_id: 'ttvjpg71', label: 'Trinket' },
  { tag_id: 'ppqj5pvo', label: 'Typhon' },
  { tag_id: '8012057x', label: 'Ursula' },
  { tag_id: 'qC6HIDti', label: 'Bowie - Day One' },
  { tag_id: 'Tr4Ld74L', label: 'Glamour - Day One' },
  { tag_id: 'Rpi1aZJT', label: 'Lucian - Day One' },
  { tag_id: '9KujYvZJ', label: 'Pounce - Day One' },
  { tag_id: 'ppH0F5ug', label: 'Sol - Day One' },
  { tag_id: '4iC1YNo1', label: 'Trinket - Day One' },
  { tag_id: '1Fodyg2c', label: 'Typhon - Day One' },
  { tag_id: 'yIhNsKQo', label: 'Ursula - Day One' },
  { tag_id: 'isQUCvE1', label: 'Bowie - Day Two' },
  { tag_id: '9qxjHGsK', label: 'Glamour - Day Two' },
  { tag_id: 'CEK0a4hn', label: 'Lucian - Day Two' },
  { tag_id: 'PrlYOAsk', label: 'Pounce - Day Two' },
  { tag_id: 'eTb9If07', label: 'Sol - Day Two' },
  { tag_id: 'ZbJyTvn7', label: 'Trinket - Day Two' },
  { tag_id: 'aUVPzkXc', label: 'Typhon - Day Two' },
  { tag_id: 'biOdPbwq', label: 'Ursula - Day Two' },
  { tag_id: 'IrCS0Q8b', label: 'Bowie - Day Three' },
  { tag_id: '4dKEwI6v', label: 'Glamour - Day Three' },
  { tag_id: '22ndKlOS', label: 'Lucian - Day Three' },
  { tag_id: '4NdLYCGz', label: 'Pounce - Day Three' },
  { tag_id: 'wlNNQokS', label: 'So - Day Threel' },
  { tag_id: 'RSEugN8S', label: 'Trinket - Day Three' },
  { tag_id: '2VND0hCW', label: 'Typhon - Day Three' },
  { tag_id: '4rLC2YIq', label: 'Ursula - Day Three' },

];

const scans = [
  // { user_id: 'fang', tag_id: 'bowie', for_date: '2025-08-24' },
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
        if(scan.for_date){
            db.run(
                `INSERT OR IGNORE INTO scans (user_id, tag_id, for_date) VALUES (?, ?, ?)`,
                [scan.user_id, scan.tag_id, scan.for_date],
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
        }else{
            db.run(
            `INSERT OR IGNORE INTO scans (user_id, tag_id) VALUES (?, ?)`,
            [scan.user_id, scan.tag_id],
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

      }
    );
});
