// Import required modules
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize Express app
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret';

// Dummy user data (replace this with your actual user database)
const users = [
    {
        id: 1,
        username: 'user1',
        password: '$2a$10$Qtb/eqhNvQxwn0zYvBmzeumPnOP7hmZwsKJn1cnJNygdzP6Hp6eEa' // bcrypt hash of 'password1'
    }
];

// Route to handle user authentication
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare the provided password with the stored hash using bcrypt
    bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token });
    });
});

// Middleware to authenticate requests
const authenticateUser = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authentication failed' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

// Route to handle protected resource
app.get('/my-account', authenticateUser, (req, res) => {
    // Here, you can access the authenticated user from req.user
    res.json({ message: 'Authenticated user', user: req.user });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
