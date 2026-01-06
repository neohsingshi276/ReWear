-- Demo Data for Clothing Exchange System
-- Run after database.sql to populate sample data

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE clothing_system;

-- Clear existing data
DELETE FROM chat_messages;
DELETE FROM withdrawal_requests;
DELETE FROM donation_history;
DELETE FROM password_reset_tokens;
DELETE FROM exchange_requests;
DELETE FROM transactions;
DELETE FROM products;
DELETE FROM users;

-- Reset auto increment
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE exchange_requests AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;

-- Insert demo users (password: 123456 for all)
INSERT INTO users (username, email, password, credit_score, balance, phone) VALUES
('alice', 'alice@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', 120, 150.00, '+1234567890'),
('bob', 'bob@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', 100, 50.00, '+1987654321'),
('charlie', 'charlie@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', 110, 0.00, NULL);

-- Insert demo products (is_exchangeable = TRUE by default)
INSERT INTO products (seller_id, title, description, category, size, condition_status, price, image_url, brand, status, ai_check_result, is_exchangeable) VALUES
(1, 'Vintage Denim Jacket', 'Classic 90s style denim jacket in excellent condition. Perfect for layering.', 'Outerwear', 'M', 'Lightly Used', 45.00, '/uploads/jacket1.jpg', 'Levis', 'approved', 'approved_jacket', TRUE),
(1, 'Nike Air Max Sneakers', 'White and gray colorway. Worn only a few times, minimal creasing.', 'Shoes', '42', 'Tried Once', 85.00, '/uploads/shoes1.jpg', 'Nike', 'approved', 'approved_shoes', TRUE),
(2, 'Floral Summer Dress', 'Beautiful floral pattern, perfect for beach or casual outings.', 'Dresses', 'S', 'Brand New with Tags', 35.00, '/uploads/dress1.jpg', 'Zara', 'approved', 'approved_dress', TRUE),
(2, 'Cashmere Scarf', 'Soft cashmere scarf in burgundy. Great for cold weather.', 'Accessories', 'One Size', 'Lightly Used', 28.00, '/uploads/scarf.jpg', 'Uniqlo', 'approved', 'approved_scarf', TRUE),
(3, 'Slim Fit Jeans', 'Dark wash slim fit jeans. Very comfortable stretch material.', 'Bottoms', 'L', 'Normal Wear', 30.00, '/uploads/jeans1.jpg', 'H&M', 'approved', 'approved_jeans', TRUE),
(3, 'Knit Sweater', 'Cozy cable knit sweater in cream color. Perfect for fall/winter.', 'Sweaters', 'M', 'Lightly Used', 25.00, '/uploads/sweater.jpg', 'Gap', 'approved', 'approved_sweater', FALSE);

-- Insert a sample completed transaction
INSERT INTO transactions (buyer_id, seller_id, product_id, amount, payment_method, card_last_four, status, donation_amount) VALUES
(3, 1, 1, 45.00, 'Credit Card', '4242', 'released', 2.25);

-- Insert donation record for the transaction
INSERT INTO donation_history (user_id, amount, source) VALUES
(3, 2.25, 'transaction');

-- Note: No exchange_items table anymore - exchanges use products directly
-- Exchange requests now reference products instead of exchange_items

SELECT 'Demo data inserted successfully!' as status;
SELECT CONCAT('Users: ', COUNT(*)) as info FROM users;
SELECT CONCAT('Products: ', COUNT(*)) as info FROM products;
SELECT CONCAT('Transactions: ', COUNT(*)) as info FROM transactions;
