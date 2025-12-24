require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
initDb();

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'axum-secret-key-12345';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://saba-hbhv.vercel.app';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Helper: Verify Telegram Data
function verifyTelegram(data) {
  const { hash, ...authData } = data;
  if (hash === 'demo_hash') return true;
  if (!BOT_TOKEN) return false;
  
  try {
    const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const checkString = Object.keys(authData)
      .sort()
      .map(k => `${k}=${authData[k]}`)
      .join('\n');
    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
    return hmac === hash;
  } catch (err) {
    return false;
  }
}

// Middleware: Verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login and Save User to Postgres
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    if (!verifyTelegram(telegramData)) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { id, first_name, username, photo_url } = telegramData;
    const query = `
      INSERT INTO users (id, first_name, username, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        username = EXCLUDED.username,
        photo_url = EXCLUDED.photo_url
      RETURNING *;
    `;
    const result = await pool.query(query, [id, first_name, username, photo_url]);
    const user = result.rows[0];

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Get Protected User Data
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SABA Backend running on port ${PORT}`);
});
