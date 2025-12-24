const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple in-memory storage
const users = new Map();

// Config
const BOT_TOKEN = '8471878133:AAHHxTHp4_gKm8bx3FkpljPc9vZH9YQT3UU';
const JWT_SECRET = 'my-secret-key-123';

// Middleware
app.use(cors());
app.use(express.json());

// Verify Telegram hash
function verifyTelegram(data) {
  const { hash, ...authData } = data;
  
  // Allow demo mode
  if (hash === 'demo_hash') return true;
  
  try {
    const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const checkString = Object.keys(authData).sort().map(k => `${k}=${authData[k]}`).join('\n');
    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
    return hmac === hash;
  } catch {
    return false;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', users: users.size });
});

// Login
app.post('/api/auth/telegram', (req, res) => {
  console.log('Login attempt:', req.body);
  
  if (!verifyTelegram(req.body)) {
    return res.status(401).json({ error: 'Invalid auth' });
  }
  
  const { id, first_name, username, photo_url } = req.body;
  
  // Create or update user
  if (!users.has(id.toString())) {
    users.set(id.toString(), {
      id: id.toString(),
      first_name,
      username: username || first_name,
      photo_url: photo_url || '',
      points: 0,
      level: 1,
      joinedAt: new Date()
    });
  }
  
  const user = users.get(id.toString());
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  
  console.log('Login success:', user.username);
  
  res.json({ token, user });
});

// Get user data
app.get('/api/user', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    const user = users.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
