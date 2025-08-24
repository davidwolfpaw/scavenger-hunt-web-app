const app = require('./app'); // Import the app instance
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Scavenger Hunt server running at http://localhost:${port}`);
});
