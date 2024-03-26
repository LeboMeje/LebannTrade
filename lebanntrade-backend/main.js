// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { check, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Load environment variables
dotenv.config();

// Define MongoDB connection URI
const mongodbURI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(mongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Define user schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
});

// Define product schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
});

// Define order schema
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Define user model
const User = mongoose.model('User', userSchema);

// Define product model
const Product = mongoose.model('Product', productSchema);

// Define order model
const Order = mongoose.model('Order', orderSchema);

// Middleware for authentication
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

// Middleware for admin authorization
const authorizeAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'You are not authorized to perform this action' });
    }
    next();
};

// Routes

// User registration
app.post('/users/register', [
    check('username').not().isEmpty().withMessage('Username is required'),
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.status(201).json({ user, token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User login
app.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user profile
app.get('/users/profile', authenticateUser, async (req, res) => {
    res.json(req.user);
});

// Create a new product (admin only)
app.post('/products', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all products
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new order
app.post('/orders', authenticateUser, async (req, res) => {
    try {
        const { products, totalAmount } = req.body;
        const order = new Order({ user: req.user._id, products, totalAmount });
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Handle Stripe payment
app.post('/payments', authenticateUser, async (req, res) => {
    try {
        const { amount, token } = req.body;
        const charge = await stripe.charges.create({
            amount: amount * 100, // Convert amount to cents
            currency: 'usd',
            source: token,
        });
        res.status(200).json({ message: 'Payment successful', charge });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console
