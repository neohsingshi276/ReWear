const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');
const fs = require('fs');
const { checkImageModeration } = require('./services/aiModeration');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'secret_key_123';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});


// Create upload dir
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ========== 用户相关 ==========

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please fill all required fields' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)',
      [username, email, hash, phone || null]
    );
    res.status(201).json({ message: 'Registration successful', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed, email may already be in use' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
    if (users.length === 0) return res.status(400).json({ error: 'User not found' });
    
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, credit_score: user.credit_score, balance: user.balance || 0 } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.json({ message: 'If email exists, reset link has been sent' });

    const token = crypto.randomBytes(32).toString('hex');
    await db.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [users[0].id, token, new Date(Date.now() + 3600000)]);
    
    // In production send email, demo returns token directly
    res.json({ message: 'Reset token generated', token });
  } catch (err) {
    res.status(500).json({ error: 'Operation failed' });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()', [token]);
    if (tokens.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, tokens[0].user_id]);
    await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = ?', [tokens[0].id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Get current user
app.get('/api/me', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, avatar, credit_score, balance, phone FROM users WHERE id = ?', [req.user.id]);
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// ========== 商品相关 ==========

// List product - 同步AI审核
app.post('/api/products', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, size, condition, price, brand, is_exchangeable } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('==========================================');
    console.log('[Upload] New product upload:', title);
    console.log('[Upload] User:', req.user.username, '(ID:', req.user.id, ')');

    let status = 'pending';
    let aiResult = 'unverified';

    // If image, run AI check (sync)
    if (req.file) {
      const localPath = path.join(__dirname, 'uploads', req.file.filename);
      console.log('[AI Check] Analyzing image...');
      console.log('[AI Check] File:', localPath);
      
      try {
        const r = await checkImageModeration(localPath);
        status = r.status;
        aiResult = r.ai_check_result;
        
        console.log('[AI Check] Analysis done!');
        console.log('[AI Check] Decision:', r.decision);
        console.log('[AI Check] Status:', status);
        console.log('[AI Check] Details:', aiResult);
        if (r.clothing_type) console.log('[AI Check] Type:', r.clothing_type);
        if (r.confidence) console.log('[AI Check] Confidence:', (r.confidence * 100).toFixed(1) + '%');
      } catch (aiErr) {
        console.log('[AI Check] Call failed:', aiErr.message);
        aiResult = 'ai_error';
        status = 'pending'; // Set to pending when AI fails
      }
    }

    // Insert to DB
    const [result] = await db.query(
      'INSERT INTO products (seller_id, title, description, category, size, condition_status, price, image_url, status, ai_check_result, brand, is_exchangeable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description, category, size, condition, price, image_url, status, aiResult, brand, is_exchangeable !== 'false']
    );

    console.log('[DB] Product saved, ID:', result.insertId);
    console.log('==========================================');

    res.status(201).json({ 
      message: status === 'approved' ? 'Approved and listed' : status === 'rejected' ? 'Review failed' : 'Submitted for review',
      productId: result.insertId, 
      status, 
      aiResult 
    });
  } catch (err) {
    console.error('[Error]', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `SELECT p.*, u.username as seller_name FROM products p 
                 JOIN users u ON p.seller_id = u.id WHERE p.status = 'approved'`;
    const params = [];

    if (category) { query += ' AND p.category = ?'; params.push(category); }
    if (search) { 
      query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY p.created_at DESC';

    const [products] = await db.query(query, params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Get my products
app.get('/api/my-products', auth, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Update product
app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { price, is_exchangeable } = req.body;
    const [products] = await db.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    if (products.length === 0) return res.status(403).json({ error: 'Not authorized' });

    const updates = [], params = [];
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (is_exchangeable !== undefined) { updates.push('is_exchangeable = ?'); params.push(is_exchangeable); }
    
    if (updates.length > 0) {
      params.push(req.params.id);
      await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delist product
app.put('/api/products/:id/delist', auth, async (req, res) => {
  try {
    const [p] = await db.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    if (p.length === 0) return res.status(403).json({ error: 'Not authorized' });
    await db.query('UPDATE products SET status = "delisted" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Delisted' });
  } catch (err) {
    res.status(500).json({ error: 'Operation failed' });
  }
});

// Relist product
app.put('/api/products/:id/relist', auth, async (req, res) => {
  try {
    const [p] = await db.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    if (p.length === 0) return res.status(403).json({ error: 'Not authorized' });
    await db.query('UPDATE products SET status = "approved" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Listed' });
  } catch (err) {
    res.status(500).json({ error: 'Operation failed' });
  }
});

// ========== 交换相关 ==========

// Get exchangeable products（排除自己的）
app.get('/api/exchange-products', auth, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, u.username as seller_name FROM products p 
      JOIN users u ON p.seller_id = u.id 
      WHERE p.status = 'approved' AND p.is_exchangeable = TRUE AND p.seller_id != ?
      ORDER BY p.created_at DESC`, [req.user.id]);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Get my exchangeable products
app.get('/api/my-exchange-products', auth, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT * FROM products WHERE seller_id = ? AND status = 'approved' AND is_exchangeable = TRUE
      ORDER BY created_at DESC`, [req.user.id]);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Create exchange request
app.post('/api/exchange-requests', auth, async (req, res) => {
  try {
    const { receiver_id, requester_product_id, receiver_product_id } = req.body;
    
    // Verify products
    const [my] = await db.query('SELECT * FROM products WHERE id = ? AND seller_id = ? AND is_exchangeable = TRUE AND status = "approved"',
      [requester_product_id, req.user.id]);
    if (my.length === 0) return res.status(400).json({ error: 'Your item is not available for exchange' });

    const [their] = await db.query('SELECT * FROM products WHERE id = ? AND seller_id = ? AND is_exchangeable = TRUE AND status = "approved"',
      [receiver_product_id, receiver_id]);
    if (their.length === 0) return res.status(400).json({ error: 'Their item is not available for exchange' });

    await db.query('INSERT INTO exchange_requests (requester_id, receiver_id, requester_product_id, receiver_product_id) VALUES (?, ?, ?, ?)',
      [req.user.id, receiver_id, requester_product_id, receiver_product_id]);
    res.json({ message: 'Exchange request sent' });
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// Get my exchanges
app.get('/api/my-exchanges', auth, async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT er.*, 
        u1.username as requester_name, u1.email as requester_email,
        u2.username as receiver_name, u2.email as receiver_email,
        p1.title as requester_product_title, p1.image_url as requester_product_image, p1.price as requester_product_price,
        p2.title as receiver_product_title, p2.image_url as receiver_product_image, p2.price as receiver_product_price
      FROM exchange_requests er
      JOIN users u1 ON er.requester_id = u1.id
      JOIN users u2 ON er.receiver_id = u2.id
      JOIN products p1 ON er.requester_product_id = p1.id
      JOIN products p2 ON er.receiver_product_id = p2.id
      WHERE er.requester_id = ? OR er.receiver_id = ?
      ORDER BY er.created_at DESC`, [req.user.id, req.user.id]);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Accept/reject exchange
app.put('/api/exchange-requests/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const [reqs] = await db.query('SELECT * FROM exchange_requests WHERE id = ?', [req.params.id]);
    if (reqs.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (reqs[0].receiver_id !== req.user.id && status !== 'completed') return res.status(403).json({ error: 'Not authorized' });

    await db.query('UPDATE exchange_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Confirm exchange（双方都要确认）
app.put('/api/exchange-requests/:id/confirm', auth, async (req, res) => {
  try {
    const [reqs] = await db.query('SELECT * FROM exchange_requests WHERE id = ?', [req.params.id]);
    if (reqs.length === 0) return res.status(404).json({ error: 'Request not found' });
    
    const r = reqs[0];
    if (r.status !== 'accepted') return res.status(400).json({ error: 'Please accept exchange first' });

    const isReq = r.requester_id === req.user.id;
    const isRec = r.receiver_id === req.user.id;
    if (!isReq && !isRec) return res.status(403).json({ error: 'Not authorized' });

    // Update confirmation
    if (isReq) await db.query('UPDATE exchange_requests SET requester_confirmed = TRUE WHERE id = ?', [req.params.id]);
    else await db.query('UPDATE exchange_requests SET receiver_confirmed = TRUE WHERE id = ?', [req.params.id]);

    // Check if both confirmed
    const [updated] = await db.query('SELECT * FROM exchange_requests WHERE id = ?', [req.params.id]);
    if (updated[0].requester_confirmed && updated[0].receiver_confirmed) {
      await db.query('UPDATE exchange_requests SET status = "completed" WHERE id = ?', [req.params.id]);
      await db.query('UPDATE products SET status = "sold" WHERE id IN (?, ?)', [r.requester_product_id, r.receiver_product_id]);
      await db.query('UPDATE users SET credit_score = credit_score + 10 WHERE id IN (?, ?)', [r.requester_id, r.receiver_id]);
      res.json({ message: 'Exchange completed!', completed: true });
    } else {
      res.json({ message: 'Confirmed, waiting for other party', completed: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Confirmation failed' });
  }
});

// ========== 聊天相关 ==========

// Get messages
app.get('/api/exchange-requests/:id/messages', auth, async (req, res) => {
  try {
    const [reqs] = await db.query('SELECT * FROM exchange_requests WHERE id = ? AND (requester_id = ? OR receiver_id = ?)',
      [req.params.id, req.user.id, req.user.id]);
    if (reqs.length === 0) return res.status(403).json({ error: 'Access denied' });

    const [msgs] = await db.query(`SELECT cm.*, u.username as sender_name FROM chat_messages cm 
      JOIN users u ON cm.sender_id = u.id WHERE cm.exchange_request_id = ? ORDER BY cm.created_at ASC`, [req.params.id]);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Send message
app.post('/api/exchange-requests/:id/messages', auth, async (req, res) => {
  try {
    const [reqs] = await db.query('SELECT * FROM exchange_requests WHERE id = ? AND (requester_id = ? OR receiver_id = ?)',
      [req.params.id, req.user.id, req.user.id]);
    if (reqs.length === 0) return res.status(403).json({ error: 'Access denied' });

    await db.query('INSERT INTO chat_messages (exchange_request_id, sender_id, message) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, req.body.message]);
    res.json({ message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: 'Send failed' });
  }
});

// ========== 支付网关API ==========

// Step1: 初始化支付
app.post('/api/payment/init', auth, async (req, res) => {
  try {
    const { product_id, payment_method } = req.body;
    const [products] = await db.query('SELECT * FROM products WHERE id = ? AND status = "approved"', [product_id]);
    if (products.length === 0) return res.status(400).json({ success: false, error: 'Product not found' });

    const p = products[0];
    if (p.seller_id === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot buy your own product' });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Store session
    global.paymentSessions = global.paymentSessions || {};
    global.paymentSessions[sessionToken] = {
      productId: product_id, amount: p.price, sellerId: p.seller_id,
      buyerId: req.user.id, paymentMethod: payment_method,
      expiresAt: Date.now() + 600000, status: 'pending'
    };

    console.log('[Payment] Session created:', sessionToken.substring(0, 8) + '...');
    res.json({ success: true, sessionToken, amount: p.price, currency: 'USD', expiresIn: 600 });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Init failed' });
  }
});

// Step2: 处理支付
app.post('/api/payment/process/:token', auth, async (req, res) => {
  try {
    const session = global.paymentSessions?.[req.params.token];
    if (!session) return res.status(400).json({ success: false, error: 'Invalid session' });
    if (session.expiresAt < Date.now()) return res.status(400).json({ success: false, error: 'Session expired' });
    if (session.buyerId !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized' });

    const { card_number, phone, donation_percent } = req.body;
    
    console.log('[Payment] Processing... Method:', session.paymentMethod);
    await new Promise(r => setTimeout(r, 1500)); // Simulate delay

    // Validate card
    if (session.paymentMethod === 'Credit Card' && (!card_number || card_number.replace(/\s/g, '').length < 13)) {
      return res.status(400).json({ success: false, error: 'Invalid card number' });
    }

    // 5%chance to simulate failure
    if (Math.random() < 0.05) {
      return res.status(400).json({ success: false, error: 'Bank declined this transaction' });
    }

    session.status = 'approved';
    session.cardLastFour = card_number?.replace(/\s/g, '').slice(-4);
    session.phone = phone;
    session.donationPercent = donation_percent || 5;

    console.log('[Payment] Authorized');
    res.json({ success: true, status: 'approved', authCode: crypto.randomBytes(6).toString('hex').toUpperCase() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Process failed' });
  }
});

// Step3: 确认支付
app.post('/api/payment/confirm/:token', auth, async (req, res) => {
  try {
    const session = global.paymentSessions?.[req.params.token];
    if (!session || session.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Payment not authorized' });
    }

    const donation = (parseFloat(session.amount) * (session.donationPercent || 5) / 100).toFixed(2);

    // Create transaction
    const [result] = await db.query(
      'INSERT INTO transactions (buyer_id, seller_id, product_id, amount, payment_method, card_last_four, phone, status, donation_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [session.buyerId, session.sellerId, session.productId, session.amount, session.paymentMethod, session.cardLastFour, session.phone, 'held', donation]
    );

    await db.query('UPDATE products SET status = "sold" WHERE id = ?', [session.productId]);
    await db.query('INSERT INTO donation_history (user_id, amount, source) VALUES (?, ?, ?)', [session.buyerId, donation, 'transaction']);

    delete global.paymentSessions[req.params.token];
    
    console.log('[Payment] Transaction complete, ID:', result.insertId);
    res.json({ success: true, transactionId: result.insertId, amount: session.amount, donationAmount: donation });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Transaction failed' });
  }
});

// ========== 订单和余额 ==========

// Get my orders
app.get('/api/my-transactions', auth, async (req, res) => {
  try {
    const [txs] = await db.query(`
      SELECT t.*, p.title as product_title, p.image_url, b.username as buyer_name, s.username as seller_name
      FROM transactions t JOIN products p ON t.product_id = p.id
      JOIN users b ON t.buyer_id = b.id JOIN users s ON t.seller_id = s.id
      WHERE t.buyer_id = ? OR t.seller_id = ? ORDER BY t.created_at DESC`, [req.user.id, req.user.id]);
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Seller ships
app.put('/api/transactions/:id/ship', auth, async (req, res) => {
  try {
    const [txs] = await db.query('SELECT * FROM transactions WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    if (txs.length === 0) return res.status(403).json({ error: 'Not authorized' });
    await db.query('UPDATE transactions SET status = "shipped" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Shipped' });
  } catch (err) {
    res.status(500).json({ error: 'Operation failed' });
  }
});

// Buyer confirms
app.put('/api/transactions/:id/confirm', auth, async (req, res) => {
  try {
    const [txs] = await db.query('SELECT * FROM transactions WHERE id = ? AND buyer_id = ?', [req.params.id, req.user.id]);
    if (txs.length === 0) return res.status(403).json({ error: 'Not authorized' });
    
    const tx = txs[0];
    if (tx.status === 'released') return res.status(400).json({ error: 'Completed' });

    // Transfer to seller
    const amount = parseFloat(tx.amount) - parseFloat(tx.donation_amount);
    await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, tx.seller_id]);
    await db.query('UPDATE transactions SET status = "released" WHERE id = ?', [req.params.id]);
    await db.query('UPDATE users SET credit_score = credit_score + 10 WHERE id = ?', [tx.seller_id]);
    
    res.json({ message: 'Confirmed, funds released to seller' });
  } catch (err) {
    res.status(500).json({ error: 'Operation failed' });
  }
});

// Get balance
app.get('/api/balance', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    const [donations] = await db.query('SELECT SUM(amount) as total FROM donation_history WHERE user_id = ?', [req.user.id]);
    res.json({ balance: users[0]?.balance || 0, totalDonations: donations[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Get billing history (transactions, donations, withdrawals)
app.get('/api/my-billing-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Transactions (Buying) - Money Out
    const [buying] = await db.query(`
      SELECT 'purchase' as type, -amount as amount, created_at, status, id, 'Purchase' as description 
      FROM transactions WHERE buyer_id = ?`, [userId]);

    // 2. Transactions (Selling) - Money In (only when released) or Pending
    const [selling] = await db.query(`
      SELECT 'sale' as type, (amount - donation_amount) as amount, created_at, status, id, 'Sale Revenue' as description 
      FROM transactions WHERE seller_id = ?`, [userId]);

    // 3. Donations - Money Out
    const [donations] = await db.query(`
      SELECT 'donation' as type, -amount as amount, created_at, 'completed' as status, id, 'Charity Donation' as description 
      FROM donation_history WHERE user_id = ?`, [userId]);

    // 4. Withdrawals - Money Out
    const [withdrawals] = await db.query(`
      SELECT 'withdrawal' as type, -amount as amount, created_at, status, id, 'Withdrawal' as description 
      FROM withdrawal_requests WHERE user_id = ?`, [userId]);

    // Combine and sort
    const all = [...buying, ...selling, ...donations, ...withdrawals]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

// Donate
app.post('/api/donate', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const [users] = await db.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    if (parseFloat(users[0].balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, req.user.id]);
    await db.query('INSERT INTO donation_history (user_id, amount, source) VALUES (?, ?, ?)', [req.user.id, amount, 'manual']);
    res.json({ message: 'Donation successful, thank you!' });
  } catch (err) {
    res.status(500).json({ error: 'Donation failed' });
  }
});

// Withdraw
app.post('/api/withdraw', auth, async (req, res) => {
  try {
    const { amount, bank_card } = req.body;
    const [users] = await db.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    if (parseFloat(users[0].balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, req.user.id]);
    await db.query('INSERT INTO withdrawal_requests (user_id, amount, bank_card, status) VALUES (?, ?, ?, ?)',
      [req.user.id, amount, bank_card, 'pending']);
    res.json({ message: 'Withdrawal submitted, 1-3 business days to arrive' });
  } catch (err) {
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Legacy compatibility
app.get('/api/exchange-items', auth, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.id, p.seller_id as owner_id, p.title, p.description, p.category, p.size, 
             p.condition_status, p.image_url, p.brand, p.status = 'approved' as is_available, 
             p.created_at, u.username as owner_name
      FROM products p JOIN users u ON p.seller_id = u.id 
      WHERE p.status = 'approved' AND p.is_exchangeable = TRUE ORDER BY p.created_at DESC`);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.get('/api/my-exchange-items', auth, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.id, p.seller_id as owner_id, p.title, p.description, p.category, p.size, 
             p.condition_status, p.image_url, p.brand, p.status = 'approved' as is_available, p.created_at
      FROM products p WHERE p.seller_id = ? AND p.is_exchangeable = TRUE AND p.status IN ('approved', 'pending')
      ORDER BY p.created_at DESC`, [req.user.id]);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

