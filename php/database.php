<?php
// Database configuration
$servername = "localhost";
$username = "username";
$password = "password";
$database = "e_commercedb";

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Insert new product into the database
function insertProduct($name, $price, $description) {
    global $conn;
    $sql = "INSERT INTO products (name, price, description) VALUES ('$name', '$price', '$description')";
    if ($conn->query($sql) === TRUE) {
        return "New product added successfully";
    } else {
        return "Error: " . $sql . "<br>" . $conn->error;
    }
}

// Retrieve all products from the database
function getProducts() {
    global $conn;
    $sql = "SELECT * FROM products";
    $result = $conn->query($sql);
    $products = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
    }
    return $products;
}

// Update product details in the database
function updateProduct($id, $name, $price, $description) {
    global $conn;
    $sql = "UPDATE products SET name='$name', price='$price', description='$description' WHERE id=$id";
    if ($conn->query($sql) === TRUE) {
        return "Product updated successfully";
    } else {
        return "Error updating product: " . $conn->error;
    }
}

// Delete product from the database
function deleteProduct($id) {
    global $conn;
    $sql = "DELETE FROM products WHERE id=$id";
    if ($conn->query($sql) === TRUE) {
        return "Product deleted successfully";
    } else {
        return "Error deleting product: " . $conn->error;
    }
}

// Close connection
$conn->close();
?>
