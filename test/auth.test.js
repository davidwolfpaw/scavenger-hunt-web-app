describe('POST /register', () => {
	it('should create a new account', async () => {
		const res = await request(server)
			.post('/register')
			.send({
				username: 'testuser', // Ensure this matches your server's requirements
				password: 'password123', // Ensure this matches your server's requirements
				email: 'testuser@example.com' // Ensure this matches your server's requirements
			});
		expect(res.status).to.equal(201);
		expect(res.body).to.have.property('success', true);
		expect(res.body).to.have.property('message', 'Account created successfully');
	});
});

describe('POST /login', () => {
	it('should log in an existing account', async () => {
		const res = await request(server)
			.post('/login')
			.send({
				username: 'testuser', // Ensure this matches your server's requirements
				password: 'password123' // Ensure this matches your server's requirements
			});
		expect(res.status).to.equal(200);
		expect(res.body).to.have.property('success', true);
		expect(res.body).to.have.property('token'); // Assuming a token is returned
	});
});
