-- =============================================
-- ReWear - Supabase (PostgreSQL) Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS withdrawal_requests CASCADE;
DROP TABLE IF EXISTS donation_history CASCADE;
DROP TABLE IF EXISTS exchange_requests CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  credit_score INTEGER DEFAULT 100,
  balance NUMERIC(10,2) DEFAULT 0.00,
  phone VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  category VARCHAR(100) DEFAULT NULL,
  size VARCHAR(50) DEFAULT NULL,
  condition_status VARCHAR(50) DEFAULT NULL,
  price NUMERIC(10,2) DEFAULT 0.00,
  image_url VARCHAR(500) DEFAULT NULL,
  brand VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','sold','delisted')),
  is_exchangeable BOOLEAN DEFAULT TRUE,
  ai_check_result VARCHAR(100) DEFAULT 'unverified',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- TRANSACTIONS
-- =============================================
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT NULL,
  card_last_four VARCHAR(4) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held','shipped','released','refunded')),
  donation_amount NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- EXCHANGE REQUESTS
-- =============================================
CREATE TABLE exchange_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES users(id),
  receiver_id INTEGER NOT NULL REFERENCES users(id),
  requester_product_id INTEGER NOT NULL REFERENCES products(id),
  receiver_product_id INTEGER NOT NULL REFERENCES products(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed')),
  requester_confirmed BOOLEAN DEFAULT FALSE,
  receiver_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- CHAT MESSAGES
-- =============================================
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  exchange_request_id INTEGER NOT NULL REFERENCES exchange_requests(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- DONATION HISTORY
-- =============================================
CREATE TABLE donation_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  source VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- PASSWORD RESET TOKENS
-- =============================================
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- WITHDRAWAL REQUESTS
-- =============================================
CREATE TABLE withdrawal_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  bank_card VARCHAR(50) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- DEMO DATA
-- =============================================

INSERT INTO users (id, username, email, password, avatar, credit_score, balance, phone, created_at) VALUES
(1, 'alice', 'alice@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', NULL, 120, 150.00, '+1234567890', '2026-01-06 13:32:56'),
(2, 'bob', 'bob@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', NULL, 100, 50.00, '+1987654321', '2026-01-06 13:32:56'),
(3, 'charlie', 'charlie@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', NULL, 110, 0.00, NULL, '2026-01-06 13:32:56'),
(4, 'wyh', 'wyh@test.com', '$2a$10$R5/V0KIoHFx4wBanDOz4c.r/tPHkq8aT/aV5ts3bPtnBwBgJL9Jxa', NULL, 120, 190.00, '123456', '2026-01-06 14:33:50'),
(5, 'test', 'test@test.com', '$2a$10$CuTXXemTpOAjivk1BiZPZ.xVsT7JxX9fXReUQZpbtFgJv.huGXMJC', NULL, 120, 142.50, '123321', '2026-01-08 17:04:55'),
(6, 'admin', 'admin@test.com', '$2a$10$taZoYPAiACPPwQATg8z6uuUCB8ej0UragjM7QMEB3y/OJG1YP3kpu', NULL, 999, 0.00, NULL, '2026-01-09 14:31:13');

-- Reset sequence to continue after inserted IDs
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO products (id, seller_id, title, description, category, size, condition_status, price, image_url, brand, status, is_exchangeable, ai_check_result, created_at, is_deleted) VALUES
(1, 1, 'Vintage Denim Jacket', 'Classic 90s style denim jacket in excellent condition.', 'Outerwear', 'M', 'Lightly Used', 45.00, '/uploads/jacket1.jpg', 'Levis', 'approved', TRUE, 'approved_jacket', '2026-01-06 13:32:56', FALSE),
(2, 1, 'Nike Air Max Sneakers', 'White and gray colorway. Worn only a few times.', 'Shoes', '42', 'Tried Once', 85.00, '/uploads/shoes1.jpg', 'Nike', 'approved', TRUE, 'approved_shoes', '2026-01-06 13:32:56', FALSE),
(3, 2, 'Floral Summer Dress', 'Beautiful floral pattern, perfect for beach or casual outings.', 'Dresses', 'S', 'Brand New with Tags', 35.00, '/uploads/dress1.jpg', 'Zara', 'approved', TRUE, 'approved_dress', '2026-01-06 13:32:56', FALSE),
(4, 2, 'Cashmere Scarf', 'Soft cashmere scarf in burgundy.', 'Accessories', 'One Size', 'Lightly Used', 28.00, '/uploads/scarf.jpg', 'Uniqlo', 'approved', TRUE, 'approved_scarf', '2026-01-06 13:32:56', FALSE),
(5, 3, 'Slim Fit Jeans', 'Dark wash slim fit jeans.', 'Bottoms', 'L', 'Normal Wear', 30.00, '/uploads/jeans1.jpg', 'H&M', 'approved', TRUE, 'approved_jeans', '2026-01-06 13:32:56', FALSE),
(6, 3, 'Knit Sweater', 'Cozy cable knit sweater in cream color.', 'Sweaters', 'M', 'Lightly Used', 25.00, '/uploads/sweater.jpg', 'Gap', 'approved', FALSE, 'approved_sweater', '2026-01-06 13:32:56', FALSE);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

INSERT INTO transactions (id, buyer_id, seller_id, product_id, amount, payment_method, card_last_four, phone, status, donation_amount, created_at) VALUES
(1, 3, 1, 1, 45.00, 'Credit Card', '4242', NULL, 'released', 2.25, '2026-01-06 13:32:56'),
(2, 5, 4, 1, 200.00, 'Credit Card', '1313', '', 'released', 10.00, '2026-01-09 04:02:23'),
(3, 4, 5, 1, 150.00, 'Credit Card', '3123', '', 'released', 7.50, '2026-01-09 13:29:34');

SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));

INSERT INTO exchange_requests (id, requester_id, receiver_id, requester_product_id, receiver_product_id, status, requester_confirmed, receiver_confirmed, created_at) VALUES
(1, 5, 4, 2, 4, 'completed', TRUE, TRUE, '2026-01-09 11:51:06');

SELECT setval('exchange_requests_id_seq', (SELECT MAX(id) FROM exchange_requests));

INSERT INTO donation_history (id, user_id, amount, source, created_at) VALUES
(1, 3, 2.25, 'transaction', '2026-01-06 13:32:56'),
(2, 5, 10.00, 'transaction', '2026-01-09 04:02:23'),
(3, 4, 7.50, 'transaction', '2026-01-09 13:29:34');

SELECT setval('donation_history_id_seq', (SELECT MAX(id) FROM donation_history));
