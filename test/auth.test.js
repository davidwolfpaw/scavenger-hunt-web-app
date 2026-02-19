const { expect } = require('chai');
const request = require('supertest');
const app = require('../server/app');
const db = require('../server/db');

before(async () => {
  await db.dbReady;
});

describe('POST /register', () => {
  it('should register a new user and return userId', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Alice', identifier: 'auth-alice' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.userId).to.equal('auth-alice');
  });

  it('should reject missing name', async () => {
    const res = await request(app)
      .post('/register')
      .send({ identifier: 'auth-no-name' });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.be.a('string');
  });

  it('should reject missing identifier', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'No Identifier' });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.be.a('string');
  });

  it('should reject a duplicate identifier', async () => {
    await request(app).post('/register').send({ name: 'Bob', identifier: 'auth-dup' });
    const res = await request(app).post('/register').send({ name: 'Bob2', identifier: 'auth-dup' });
    expect(res.status).to.equal(500);
    expect(res.body.error).to.be.a('string');
  });
});

describe('POST /login', () => {
  before(async () => {
    await db.registerUser('Login User', 'auth-login-user');
  });

  it('should return a JWT token for a known user', async () => {
    const res = await request(app)
      .post('/login')
      .send({ identifier: 'auth-login-user' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.token).to.be.a('string').with.length.above(0);
  });

  it('should reject a missing identifier', async () => {
    const res = await request(app).post('/login').send({});
    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
  });

  it('should return 404 for an unknown user', async () => {
    const res = await request(app)
      .post('/login')
      .send({ identifier: 'auth-nobody' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.be.false;
  });
});

describe('GET /user/:identifier', () => {
  before(async () => {
    await db.registerUser('Carol', 'auth-carol');
  });

  it('should return the user name', async () => {
    const res = await request(app).get('/user/auth-carol');
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.name).to.equal('Carol');
  });

  it('should return 404 for an unknown user', async () => {
    const res = await request(app).get('/user/auth-ghost');
    expect(res.status).to.equal(404);
    expect(res.body.error).to.be.a('string');
  });
});
