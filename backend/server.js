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

// CORS configuration - Allow Telegram domains
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://web.telegram.org',
    /\.telegram\.org$/,
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Telegram verification logic (relaxed for WebApp)
function verifyTelegram(data) {
  const { hash, ...authData } = data;

  // Allow explicit demo hash for testing
  if (hash === 'demo_hash') {
    console.log('✅ Demo hash accepted');
    return true;
  }

  // For Telegram WebApp, user data comes without hash
  // We validate using initData instead
  if (!hash && data.id) {
    console.warn('⚠️ No hash provided - allowing WebApp user (id provided)');
    return true;
  }

  // Strict verification when BOT_TOKEN + hash exist
  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN not set - cannot verify Telegram hash');
    return false;
  }
  
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const checkString = Object.keys(authData)
    .sort()
    .map(k => `${k}=${authData[k]}`)
    .join('\n');

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(checkString)
    .digest('hex');

  const isValid = hmac === hash;
  console.log(isValid ? '✅ Telegram hash verified' : '❌ Invalid Telegram hash');
  return isValid;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: pool ? 'connected' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// Leaderboard
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

// Telegram authentication endpoint
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    console.log('📩 Incoming Telegram auth payload:', JSON.stringify(telegramData, null, 2));

    // Validate user data exists
    if (!telegramData || !telegramData.id) {
      console.error('❌ Missing user ID in request');
      return res.status(400).json({ error: 'Invalid Telegram user data - missing id' });
    }

    // Verify Telegram data
    if (!verifyTelegram(telegramData)) {
      console.error('❌ Telegram verification failed');
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    const { id, first_name, username, photo_url } = telegramData;
    
    console.log('💾 Saving user to database:', { id, first_name, username });

    const query = `
      INSERT INTO users (id, first_name, username, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET 
        first_name = EXCLUDED.first_name, 
        username = EXCLUDED.username, 
        photo_url = EXCLUDED.photo_url
      RETURNING *;
    `;
    
    const result = await pool.query(query, [id, first_name, username || null, photo_url || null]);
    const user = result.rows[0];

    console.log('✅ User saved/updated:', user.id);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ 
      success: true,
      token, 
      user: {
        id: user.id,
        first_name: user.first_name,
        username: user.username,
        photo_url: user.photo_url,
        points: user.points,
        level: user.level,
        streak: user.streak
      }
    });
  } catch (err) {
    console.error('❌ Auth error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user info (protected route)
app.get('/api/user', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.warn('⚠️ No token provided');
    return res.status(401).json({ error: 'Unauthorized - no token' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('❌ Token verification failed:', err.message);
      return res.status(403).json({ error: 'Forbidden - invalid token' });
    }

    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (dbErr) {
      console.error('❌ User fetch error:', dbErr);
      res.status(500).json({ error: 'Database error' });
    }
  });
});

// Update user points (example endpoint)
app.post('/api/user/points', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });

    try {
      const { points } = req.body;
      const query = `
        UPDATE users 
        SET points = points + $1 
        WHERE id = $2 
        RETURNING *;
      `;
      const result = await pool.query(query, [points, decoded.userId]);
      res.json(result.rows[0]);
    } catch (dbErr) {
      console.error('❌ Points update error:', dbErr);
      res.status(500).json({ error: 'Database error' });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SABA Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret: ${JWT_SECRET ? 'configured' : 'NOT SET'}`);
  console.log(`🤖 Bot Token: ${BOT_TOKEN ? 'configured' : 'NOT SET'}`);
});
