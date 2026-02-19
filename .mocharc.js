module.exports = {
  require: ['test/setup.js'],
  timeout: 10000,
  spec: 'test/**/*.test.js',
  exit: true, // ensure process exits after tests (closes SQLite connections)
};
