// Import required modules
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Define MongoDB connection URI
const mongodbURI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(mongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Define product schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
});

// Define product model
const Product = mongoose.model('Product', productSchema);

// Routes
// Get all products
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new product
app.post('/products', async (req, res) => {
    const product = new Product({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
    });
    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a product
app.put('/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a product
app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndRemove(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
