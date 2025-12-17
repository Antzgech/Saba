const express = require('express');
const router = express.Router();
const { telegramAuth, getProfile, refreshToken } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// @route   POST /api/auth/telegram
// @desc    Authenticate via Telegram
// @access  Public
router.post('/telegram', validate(schemas.telegramAuth), telegramAuth);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, getProfile);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, refreshToken);

module.exports = router;
