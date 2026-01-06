-- Create database
CREATE DATABASE IF NOT EXISTS clothing_system;
USE clothing_system;

-- Drop old tables if they exist (in correct order due to foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS withdrawal_requests;
DROP TABLE IF EXISTS donation_history;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS exchange_requests;
DROP TABLE IF EXISTS exchange_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users table (unified user, no buyer/seller distinction)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    credit_score INT DEFAULT 100,
    balance DECIMAL(10, 2) DEFAULT 0,  -- Account balance (from sales)
    phone VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products table (unified for sale AND exchange)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    size VARCHAR(50),
    condition_status VARCHAR(50),
    price DECIMAL(10, 2) DEFAULT 0,
    image_url VARCHAR(500),
    brand VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected', 'sold', 'delisted') DEFAULT 'pending',
    is_exchangeable BOOLEAN DEFAULT TRUE,  -- Can be used for exchange
    ai_check_result VARCHAR(100) DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- 3. Exchange requests table (now uses products table)
CREATE TABLE IF NOT EXISTS exchange_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    receiver_id INT NOT NULL,
    requester_product_id INT NOT NULL,  -- Product offered by requester
    receiver_product_id INT NOT NULL,   -- Product wanted by requester
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    requester_confirmed BOOLEAN DEFAULT FALSE,  -- Both must confirm to complete
    receiver_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (requester_product_id) REFERENCES products(id),
    FOREIGN KEY (receiver_product_id) REFERENCES products(id)
);

-- 4. Transactions table (payment with escrow)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    product_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    card_last_four VARCHAR(4),  -- Last 4 digits of card
    phone VARCHAR(50),
    status ENUM('held', 'shipped', 'released', 'refunded') DEFAULT 'held',
    donation_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 5. Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exchange_request_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exchange_request_id) REFERENCES exchange_requests(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 6. Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    bank_card VARCHAR(50),
    status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. Donation history table
CREATE TABLE IF NOT EXISTS donation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    source VARCHAR(50),  -- 'transaction' or 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
