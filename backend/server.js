require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'Saba1212';

// Initialize Database
initDb();

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Telegram Verification Logic
function verifyTelegram(data) {
  const { hash, ...authData } = data;
  if (hash === 'demo_hash') return true;
  if (!BOT_TOKEN) return false;
  
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const checkString = Object.keys(authData).sort().map(k => `${k}=${authData[k]}`).join('\n');
  const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
  return hmac === hash;
}

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'connected' }));
// Add this route to your server.js
app.get('/api/leaderboard', async (req, res) => {
  try {
    const query = `
      SELECT username, first_name, photo_url, points, level 
      FROM users 
      WHERE points > 0 
      ORDER BY points DESC 
      LIMIT 10;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Could not fetch leaderboard' });
  }
});
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    if (!verifyTelegram(telegramData)) return res.status(401).json({ error: 'Invalid auth' });

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
    res.status(500).json({ error: err.message });
  }
});

// Protected route to get user stats
app.get('/api/user', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
      res.json(result.rows[0]);
    } catch (dbErr) {
      res.status(500).json({ error: 'Database error' });
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SABA Backend running on port ${PORT}`);
});
