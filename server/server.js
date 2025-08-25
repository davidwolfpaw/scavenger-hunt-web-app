require('dotenv').config();

const app = require('./app'); // Import the app instance
const port = process.env.PORT || 3000;
const url = process.env.PUBLIC_URL || `http://localhost`;

app.listen(port, () => {
  console.log(`Scavenger Hunt server running at ${url}:${port}`);
});
