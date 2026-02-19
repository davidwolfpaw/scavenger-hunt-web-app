// Set environment variables before any modules are loaded.
// This file is required by mocha before test files, so DB_PATH is set
// before db.js initializes, giving us a fresh in-memory database per run.
process.env.DB_PATH = ':memory:';
process.env.SECRET_KEY = 'test-secret-key';
process.env.PUBLIC_URL = 'http://localhost:3000';
