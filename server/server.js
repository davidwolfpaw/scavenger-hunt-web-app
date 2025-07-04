const app = require('./app'); // Import the app instance
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Scavenger Hunt server running at http://localhost:${PORT}`);
});
