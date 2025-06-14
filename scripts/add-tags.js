// This script adds tags to the database.
// Ensure that your tags have unique tag_ids, and ensure that they match the tags set in config.json.
// Run with node scripts/add-tags.js

const { addTag } = require('../server/db');

// Tags that will be added to the database
const tags = [
  { tag_id: 'A1', label: 'First Tag' },
  { tag_id: 'B2', label: 'Second Tag' },
  { tag_id: 'C3', label: 'Third Tag' }
];

tags.forEach(t => {
  addTag(t.tag_id, t.label, (err) => {
	if (err) console.error(`Error adding ${t.tag_id}:`, err.message);
	else console.log(`Added tag: ${t.tag_id}`);
  });
});
