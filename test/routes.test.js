const { expect } = require('chai');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server/app');
const db = require('../server/db');

const SECRET_KEY = process.env.SECRET_KEY;

// A pre-signed admin token for testing admin-protected routes
const adminToken = jwt.sign(
  { identifier: 'routes-admin', isAdmin: true, name: 'Admin' },
  SECRET_KEY
);

// A pre-signed non-admin token for testing auth rejection
const nonAdminToken = jwt.sign(
  { identifier: 'routes-user', isAdmin: false, name: 'User' },
  SECRET_KEY
);

describe('Scan Routes', () => {
  before(async () => {
    await db.dbReady;
    await db.addTag('routes-tag-1', 'Tag One');
    await db.addTag('routes-tag-2', 'Tag Two');
  });

  describe('POST /scan', () => {
    before(async () => {
      await db.registerUser('Scan User', 'routes-scan-user');
    });

    it('should log a new scan', async () => {
      const res = await request(app)
        .post('/scan')
        .send({ identifier: 'routes-scan-user', tagId: 'routes-tag-1' });
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.alreadyScanned).to.be.false;
    });

    it('should return alreadyScanned: true for a duplicate scan', async () => {
      // routes-scan-user already scanned routes-tag-1 above
      const res = await request(app)
        .post('/scan')
        .send({ identifier: 'routes-scan-user', tagId: 'routes-tag-1' });
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.alreadyScanned).to.be.true;
    });

    it('should reject missing identifier and tagId', async () => {
      const res = await request(app).post('/scan').send({});
      expect(res.status).to.equal(400);
      expect(res.body.error).to.be.a('string');
    });

    it('should reject an unknown tag', async () => {
      const res = await request(app)
        .post('/scan')
        .send({ identifier: 'routes-scan-user', tagId: 'routes-nonexistent-tag' });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.be.a('string');
    });

    it('should return 404 for an unknown user', async () => {
      const res = await request(app)
        .post('/scan')
        .send({ identifier: 'routes-ghost', tagId: 'routes-tag-1' });
      expect(res.status).to.equal(404);
      expect(res.body.error).to.be.a('string');
    });
  });

  describe('GET /scans/:identifier', () => {
    before(async () => {
      await db.registerUser('Scans Get User', 'routes-scans-user');
      await db.logScan('routes-scans-user', 'routes-tag-1');
    });

    it('should return the list of scans for a user', async () => {
      const res = await request(app).get('/scans/routes-scans-user');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.scans).to.be.an('array').with.lengthOf(1);
      expect(res.body.scans[0].tag_id).to.equal('routes-tag-1');
      expect(res.body.required).to.be.a('number');
    });

    it('should return 404 for an unknown user', async () => {
      const res = await request(app).get('/scans/routes-nobody');
      expect(res.status).to.equal(404);
      expect(res.body.error).to.be.a('string');
    });
  });

  describe('GET /user/:identifier/completion', () => {
    before(async () => {
      await db.registerUser('Incomplete User', 'routes-incomplete-user');

      await db.registerUser('Complete User', 'routes-complete-user');
      const tags = await db.getAllTags();
      for (const tag of tags) {
        await db.logScan('routes-complete-user', tag.tag_id);
      }
    });

    it('should return completed: false for a user with missing scans', async () => {
      const res = await request(app).get('/user/routes-incomplete-user/completion');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.completed).to.be.false;
    });

    it('should return completed: true for a user who scanned all tags', async () => {
      const res = await request(app).get('/user/routes-complete-user/completion');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.completed).to.be.true;
    });

    it('should return an error for an unknown user', async () => {
      const res = await request(app).get('/user/routes-nobody/completion');
      // Route falls through to /user/:identifier which returns 404 for unknown users
      expect(res.status).to.equal(404);
      expect(res.body.error).to.be.a('string');
    });
  });
});

describe('Admin Routes', () => {
  before(async () => {
    await db.dbReady;
  });

  describe('GET /admin/users', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/admin/users');
      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
    });

    it('should return 401 with a non-admin token', async () => {
      const res = await request(app)
        .get('/admin/users')
        .set('x-admin-token', nonAdminToken);
      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
    });

    it('should return the user list with a valid admin token', async () => {
      const res = await request(app)
        .get('/admin/users')
        .set('x-admin-token', adminToken);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.users).to.be.an('array');
    });
  });

  describe('GET /admin/tags-with-codes', () => {
    it('should return tags with QR codes for a valid admin token', async () => {
      const res = await request(app)
        .get('/admin/tags-with-codes')
        .set('x-admin-token', adminToken);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tags).to.be.an('array');
      if (res.body.tags.length > 0) {
        expect(res.body.tags[0]).to.have.property('qr');
        expect(res.body.tags[0]).to.have.property('url');
      }
    });
  });

  describe('GET /admin/first-complete', () => {
    it('should return the first-complete leaderboard for a valid admin token', async () => {
      const res = await request(app)
        .get('/admin/first-complete')
        .set('x-admin-token', adminToken);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.firstComplete).to.be.an('array');
    });
  });

  describe('GET /admin/scans-by-clue', () => {
    it('should return scan counts per tag for a valid admin token', async () => {
      const res = await request(app)
        .get('/admin/scans-by-clue')
        .set('x-admin-token', adminToken);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.clues).to.be.an('array');
    });
  });
});
