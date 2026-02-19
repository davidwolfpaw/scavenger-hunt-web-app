const { expect } = require('chai');
const db = require('../server/db');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Race Condition', () => {
  // getFirstComplete() checks COUNT(scans) = COUNT(*) FROM tags, so race users
  // must scan ALL tags in the DB (including any added by other test suites).
  it('should determine the correct winner when users complete simultaneously', async () => {
    await db.dbReady;

    // Add race-specific tags
    await db.addTag('race-tag-0', 'Race Tag 0');
    await db.addTag('race-tag-1', 'Race Tag 1');
    await db.addTag('race-tag-2', 'Race Tag 2');

    // Get ALL tags so that each user satisfies the completion check
    const allTagIds = (await db.getAllTags()).map(t => t.tag_id);

    await db.registerUser('Race User 0', 'race-user-0');
    await db.registerUser('Race User 1', 'race-user-1');
    await db.registerUser('Race User 2', 'race-user-2');

    // User 0 gets a head start on the first tag
    await db.logScan('race-user-0', allTagIds[0]);
    // >1s gap required for SQLite's 1-second timestamp resolution
    await sleep(1200);

    // User 1 scans ALL tags → should be first to complete (earliest MAX timestamp)
    for (const tagId of allTagIds) {
      await db.logScan('race-user-1', tagId);
      await sleep(250);
    }

    // User 2 scans ALL tags → second place
    for (const tagId of allTagIds) {
      await db.logScan('race-user-2', tagId);
      await sleep(250);
    }

    // User 0 finishes remaining tags → third place
    for (const tagId of allTagIds.slice(1)) {
      await db.logScan('race-user-0', tagId);
      await sleep(250);
    }

    const firstComplete = await db.getFirstComplete();

    expect(firstComplete[0].identifier).to.equal('race-user-1');
    expect(firstComplete[1].identifier).to.equal('race-user-2');
    expect(firstComplete[2].identifier).to.equal('race-user-0');
  }).timeout(15000);
});
