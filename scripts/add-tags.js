// ⚠️  NOTE: Tags are now automatically seeded from public/config.json when the app starts.
// This script is kept for reference only. To add or modify tags:
//   1. Edit the tagStamps object in public/config.json
//   2. Restart the app — new tags will be automatically seeded
//
// This script can be used to manually add tags if needed:
// Run with node scripts/add-tags.js

const { addTag, dbReady } = require("../server/db");

// Tags can be added here if needed outside the config.json workflow
const tags = [
  // { tag_id: 'custom-tag-1', label: 'Custom Tag' }
];

(async () => {
  await dbReady;

  if (tags.length === 0) {
    console.log(
      "ℹ️  No manual tags defined. Tags are auto-seeded from public/config.json.",
    );
    process.exit(0);
  }

  let added = 0;
  tags.forEach((t) => {
    addTag(t.tag_id, t.label)
      .then(() => {
        console.log(`Added tag: ${t.tag_id} (${t.label})`);
        added++;
        if (added === tags.length) process.exit(0);
      })
      .catch((err) => {
        console.error(`Error adding ${t.tag_id}:`, err.message);
        added++;
        if (added === tags.length) process.exit(1);
      });
  });
})();
