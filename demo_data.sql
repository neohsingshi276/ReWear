-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主机： 127.0.0.1
-- 生成日期： 2026-01-10 06:28:14
-- 服务器版本： 10.4.32-MariaDB
-- PHP 版本： 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 数据库： `clothing_system`
--

-- --------------------------------------------------------

--
-- 表的结构 `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `exchange_request_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 表的结构 `donation_history`
--

CREATE TABLE `donation_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `source` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 转存表中的数据 `donation_history`
--

INSERT INTO `donation_history` (`id`, `user_id`, `amount`, `source`, `created_at`) VALUES
(1, 3, 2.25, 'transaction', '2026-01-06 13:32:56'),
(2, 5, 10.00, 'transaction', '2026-01-09 04:02:23'),
(3, 4, 7.50, 'transaction', '2026-01-09 13:29:34');

-- --------------------------------------------------------

--
-- 表的结构 `exchange_requests`
--

CREATE TABLE `exchange_requests` (
  `id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `requester_product_id` int(11) NOT NULL,
  `receiver_product_id` int(11) NOT NULL,
  `status` enum('pending','accepted','rejected','completed') DEFAULT 'pending',
  `requester_confirmed` tinyint(1) DEFAULT 0,
  `receiver_confirmed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 转存表中的数据 `exchange_requests`
--

INSERT INTO `exchange_requests` (`id`, `requester_id`, `receiver_id`, `requester_product_id`, `receiver_product_id`, `status`, `requester_confirmed`, `receiver_confirmed`, `created_at`) VALUES
(1, 5, 4, 24, 14, 'completed', 1, 1, '2026-01-09 11:51:06');

-- --------------------------------------------------------

--
-- 表的结构 `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `condition_status` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `image_url` varchar(500) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected','sold','delisted') DEFAULT 'pending',
  `is_exchangeable` tinyint(1) DEFAULT 1,
  `ai_check_result` varchar(100) DEFAULT 'unverified',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 转存表中的数据 `products`
--

INSERT INTO `products` (`id`, `seller_id`, `title`, `description`, `category`, `size`, `condition_status`, `price`, `image_url`, `brand`, `status`, `is_exchangeable`, `ai_check_result`, `created_at`, `is_deleted`) VALUES
(1, 1, 'Vintage Denim Jacket', 'Classic 90s style denim jacket in excellent condition. Perfect for layering.', 'Outerwear', 'M', 'Lightly Used', 45.00, '/uploads/jacket1.jpg', 'Levis', 'approved', 1, 'approved_jacket', '2026-01-06 13:32:56', 0),
(2, 1, 'Nike Air Max Sneakers', 'White and gray colorway. Worn only a few times, minimal creasing.', 'Shoes', '42', 'Tried Once', 85.00, '/uploads/shoes1.jpg', 'Nike', 'approved', 1, 'approved_shoes', '2026-01-06 13:32:56', 0),
(3, 2, 'Floral Summer Dress', 'Beautiful floral pattern, perfect for beach or casual outings.', 'Dresses', 'S', 'Brand New with Tags', 35.00, '/uploads/dress1.jpg', 'Zara', 'approved', 1, 'approved_dress', '2026-01-06 13:32:56', 0),
(4, 2, 'Cashmere Scarf', 'Soft cashmere scarf in burgundy. Great for cold weather.', 'Accessories', 'One Size', 'Lightly Used', 28.00, '/uploads/scarf.jpg', 'Uniqlo', 'approved', 1, 'approved_scarf', '2026-01-06 13:32:56', 0),
(5, 3, 'Slim Fit Jeans', 'Dark wash slim fit jeans. Very comfortable stretch material.', 'Bottoms', 'L', 'Normal Wear', 30.00, '/uploads/jeans1.jpg', 'H&M', 'approved', 1, 'approved_jeans', '2026-01-06 13:32:56', 0),
(6, 3, 'Knit Sweater', 'Cozy cable knit sweater in cream color. Perfect for fall/winter.', 'Sweaters', 'M', 'Lightly Used', 25.00, '/uploads/sweater.jpg', 'Gap', 'approved', 0, 'approved_sweater', '2026-01-06 13:32:56', 0),
(7, 4, 'Nike shoes', 'good shoes', 'Shoes', 'One Size', 'Brand New with Tags', 100.00, '/uploads/1767710315218-æªå±2026-01-06 ä¸å9.53.02.png', 'Nike', 'delisted', 1, 'approved_clothing', '2026-01-06 14:38:39', 1),
(8, 4, 'nike tshirt', 'good ', 'Sweaters', 'S', 'Brand New with Tags', 200.00, '/uploads/1767710510007-AppLogo.png', 'nike', 'delisted', 1, 'approved_clothing', '2026-01-06 14:41:55', 1),
(9, 4, 'zara shoes', 'nice shoes', 'Shoes', 'One Size', 'Has Flaws', 300.00, '/uploads/1767711445559-Image.png', 'zara', 'delisted', 1, 'approved_clothing', '2026-01-06 14:57:30', 1),
(10, 4, 'Nike shoes', 'good shoes', 'Shoes', '40', 'Brand New with Tags', 100.00, '/uploads/1767716103287-img_256-61.jpeg', 'Nike', 'delisted', 1, 'ai_request_failed', '2026-01-06 16:15:23', 1),
(11, 4, 'Nike shoes', 'new shoes', 'Shoes', '40', 'Brand New with Tags', 100.00, '/uploads/1767716417664-img_256-61.jpeg', 'Nike', 'delisted', 1, 'rejected_brand_mismatch', '2026-01-06 16:20:27', 1),
(12, 4, 'Nike shoes', 'new shoes', 'Shoes', '40', 'Brand New with Tags', 100.00, '/uploads/1767716494505-img_256-61.jpeg', 'Nike', 'delisted', 1, 'rejected_brand_mismatch', '2026-01-06 16:21:46', 1),
(13, 4, 'Nike shoes', 'new shoes', 'Shoes', '40', 'Brand New with Tags', 100.00, '/uploads/1767716509250-img_256-61.jpeg', 'Nike', 'delisted', 1, 'rejected_brand_mismatch', '2026-01-06 16:22:00', 1),
(14, 4, 'Nike shoes', 'new shoes', 'Shoes', '40', 'Brand New with Tags', 100.00, '/uploads/1767716526680-img_256-386.jpeg', 'Nike', 'sold', 1, 'approved_brand_match', '2026-01-06 16:22:23', 0),
(15, 4, 'Adidas shirt', 'good shirt', 'Outerwear', 'M', 'Tried Once', 200.00, '/uploads/1767716817668-e59cc9e02dc41ab3.jpg', 'Adidas', 'delisted', 1, 'rejected_brand_mismatch', '2026-01-06 16:27:46', 1),
(16, 4, 'Adidas shirt', 'good shirt', 'Outerwear', 'M', 'Tried Once', 200.00, '/uploads/1767716873252-R.jpg', 'Adidas', 'delisted', 1, 'ai_request_failed', '2026-01-06 16:28:53', 1),
(17, 4, 'adidas shirt', 'new', 'Tops', 'M', 'Tried Once', 200.00, '/uploads/1767716959263-R.jpg', 'Adidas', 'sold', 1, 'approved_brand_match', '2026-01-06 16:29:33', 1),
(18, 4, 'nike shoes', 'ee', 'Tops', 'M', 'Tried Once', 300.00, '/uploads/1767717101111-æªå±2026-01-06 ä¸å9.53.02.png', 'nike', 'delisted', 1, 'rejected_not_clothing', '2026-01-06 16:32:00', 1),
(19, 4, 'nike shirt', 'qq', 'Dresses', 'M', 'Tried Once', 100.00, '/uploads/1767717268440-4147.png_860.png', 'nike', 'delisted', 1, 'pending_brand_unknown', '2026-01-06 16:34:43', 1),
(20, 4, 'nike shirt', '11', 'Sweaters', 'M', 'Tried Once', 100.00, '/uploads/1767717366332-img_256-386.jpeg', 'nike', 'delisted', 1, 'approved_brand_match', '2026-01-06 16:36:40', 1),
(21, 4, 'nike shirts', '11', 'Tops', 'M', 'Tried Once', 100.00, '/uploads/1767718953167-img_256-386.jpeg', 'nike', 'delisted', 1, 'rejected_type_mismatch', '2026-01-06 17:03:19', 1),
(22, 4, 'nike shirts', '11', 'Shoes', 'M', 'Tried Once', 100.00, '/uploads/1767719006488-img_256-386.jpeg', 'nike', 'delisted', 1, 'approved_brand_and_type_match', '2026-01-06 17:04:21', 1),
(23, 4, 'nike shirt', '33', 'Shoes', 'M', 'Tried Once', 22.00, '/uploads/1767719130116-img_256-386.jpeg', 'nike', 'delisted', 1, 'approved_brand_and_type_match', '2026-01-06 17:06:18', 1),
(24, 5, 'nike shoes', '11', 'Shoes', 'M', 'Tried Once', 200.00, '/uploads/1767891940258-img_256-386.jpeg', 'nike', 'sold', 1, 'approved_brand_and_type_match', '2026-01-08 17:05:49', 1),
(25, 4, 'nike shoe', '3', 'Shoes', 'M', 'Tried Once', 2000.00, '/uploads/1767959967890-img_256-386.jpeg', 'nike', 'approved', 1, 'approved_brand_match', '2026-01-09 12:00:04', 0),
(26, 5, 'nike shoes', 'wq', 'Shoes', 'M', 'Tried Once', 150.00, '/uploads/1767965187371-img_256-61.jpeg', 'nike', 'rejected', 1, 'rejected_brand_mismatch', '2026-01-09 13:26:46', 1),
(27, 5, 'nike shoes', 'wq', 'Shoes', 'M', 'Tried Once', 150.00, '/uploads/1767965261083-e59cc9e02dc41ab3.jpg', 'nike', 'sold', 1, 'approved_brand_match', '2026-01-09 13:27:52', 1),
(28, 5, 'nike', '33', 'Shoes', 'M', 'Tried Once', 1212.00, '/uploads/1767965413325-img_256-386.jpeg', 'nike', 'approved', 1, 'approved_brand_match', '2026-01-09 13:30:38', 1),
(29, 5, 'nike', '1', 'Shoes', 'M', 'Tried Once', 12.00, '/uploads/1767965714437-img_256-386.jpeg', 'nike', 'approved', 1, 'approved_brand_match', '2026-01-09 13:35:48', 1),
(30, 4, 'nike shoes', 'aaa', 'Shoes', '41', 'Tried Once', 12.00, '/uploads/1767965799493-e59cc9e02dc41ab3.jpg', 'nike', 'approved', 1, 'approved_brand_match', '2026-01-09 13:37:03', 0),
(31, 4, 'nike', '11', 'Shoes', 'M', 'Tried Once', 112.00, '/uploads/1767968665018-4147.png_860.png', 'nike', 'rejected', 1, 'rejected_brand_mismatch', '2026-01-09 14:24:49', 0),
(32, 4, 'nike', '11', 'Shoes', 'M', 'Tried Once', 112.00, '/uploads/1767968719882-R.jpg', 'nike', 'rejected', 1, 'rejected_brand_mismatch', '2026-01-09 14:25:33', 0),
(33, 4, 'nike', '11', 'Shoes', 'M', 'Tried Once', 112.00, '/uploads/1767968748057-4147.png_860.png', 'cloth', 'approved', 1, 'approved_clothing', '2026-01-09 14:26:03', 0),
(34, 4, 'shoes', '111', 'Sweaters', '40', 'Brand New with Tags', 200.00, '/uploads/1767968821944-4147.png_860.png', 'Nike', 'rejected', 1, 'pending_brand_unknown', '2026-01-09 14:27:44', 0);

-- --------------------------------------------------------

--
-- 表的结构 `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `card_last_four` varchar(4) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` enum('held','shipped','released','refunded') DEFAULT 'held',
  `donation_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 转存表中的数据 `transactions`
--

INSERT INTO `transactions` (`id`, `buyer_id`, `seller_id`, `product_id`, `amount`, `payment_method`, `card_last_four`, `phone`, `status`, `donation_amount`, `created_at`) VALUES
(1, 3, 1, 1, 45.00, 'Credit Card', '4242', NULL, 'released', 2.25, '2026-01-06 13:32:56'),
(2, 5, 4, 17, 200.00, 'Credit Card', '1313', '', 'released', 10.00, '2026-01-09 04:02:23'),
(3, 4, 5, 27, 150.00, 'Credit Card', '3123', '', 'released', 7.50, '2026-01-09 13:29:34');

-- --------------------------------------------------------

--
-- 表的结构 `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `credit_score` int(11) DEFAULT 100,
  `balance` decimal(10,2) DEFAULT 0.00,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 转存表中的数据 `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `avatar`, `credit_score`, `balance`, `phone`, `created_at`) VALUES
(1, 'alice', 'alice@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', NULL, 120, 150.00, '+1234567890', '2026-01-06 13:32:56'),
(2, 'bob', 'bob@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', NULL, 100, 50.00, '+1987654321', '2026-01-06 13:32:56'),
(3, 'charlie', 'charlie@test.com', '$2a$10$rQnM1k.m9G7qKJGq0QxjH.5YmQ4h8TmJXf1Y1r9Z3HqMVJNQ3YQXS', NULL, 110, 0.00, NULL, '2026-01-06 13:32:56'),
(4, 'wyh', 'wyh@test.com', '$2a$10$R5/V0KIoHFx4wBanDOz4c.r/tPHkq8aT/aV5ts3bPtnBwBgJL9Jxa', NULL, 120, 190.00, '123456', '2026-01-06 14:33:50'),
(5, 'test', 'test@test.com', '$2a$10$CuTXXemTpOAjivk1BiZPZ.xVsT7JxX9fXReUQZpbtFgJv.huGXMJC', NULL, 120, 142.50, '123321', '2026-01-08 17:04:55'),
(6, 'admin', 'admin@test.com', '$2a$10$taZoYPAiACPPwQATg8z6uuUCB8ej0UragjM7QMEB3y/OJG1YP3kpu', NULL, 999, 0.00, NULL, '2026-01-09 14:31:13');

--
-- 转储表的索引
--

--
-- 表的索引 `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `exchange_request_id` (`exchange_request_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- 表的索引 `donation_history`
--
ALTER TABLE `donation_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- 表的索引 `exchange_requests`
--
ALTER TABLE `exchange_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `requester_product_id` (`requester_product_id`),
  ADD KEY `receiver_product_id` (`receiver_product_id`);

--
-- 表的索引 `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `seller_id` (`seller_id`);

--
-- 表的索引 `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `buyer_id` (`buyer_id`),
  ADD KEY `seller_id` (`seller_id`),
  ADD KEY `product_id` (`product_id`);

--
-- 表的索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- 在导出的表使用AUTO_INCREMENT
--

--
-- 使用表AUTO_INCREMENT `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `donation_history`
--
ALTER TABLE `donation_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用表AUTO_INCREMENT `exchange_requests`
--
ALTER TABLE `exchange_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用表AUTO_INCREMENT `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- 使用表AUTO_INCREMENT `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用表AUTO_INCREMENT `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 限制导出的表
--

--
-- 限制表 `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`exchange_request_id`) REFERENCES `exchange_requests` (`id`),
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`);

--
-- 限制表 `donation_history`
--
ALTER TABLE `donation_history`
  ADD CONSTRAINT `donation_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- 限制表 `exchange_requests`
--
ALTER TABLE `exchange_requests`
  ADD CONSTRAINT `exchange_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `exchange_requests_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `exchange_requests_ibfk_3` FOREIGN KEY (`requester_product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `exchange_requests_ibfk_4` FOREIGN KEY (`receiver_product_id`) REFERENCES `products` (`id`);

--
-- 限制表 `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`);

--
-- 限制表 `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
