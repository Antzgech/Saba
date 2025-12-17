const express = require('express');
const router = express.Router();
const {
  canPlay,
  startGame,
  completeGame,
  gameHistory,
  gameStats
} = require('../controllers/gameController');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// @route   GET /api/game/can-play
// @desc    Check if user can play
// @access  Private
router.get('/can-play', auth, canPlay);

// @route   POST /api/game/start
// @desc    Start new game session
// @access  Private
router.post('/start', auth, startGame);

// @route   POST /api/game/complete
// @desc    Complete game and award points
// @access  Private
router.post('/complete', auth, validate(schemas.gameComplete), completeGame);

// @route   GET /api/game/history
// @desc    Get game history
// @access  Private
router.get('/history', auth, gameHistory);

// @route   GET /api/game/stats
// @desc    Get game statistics
// @access  Private
router.get('/stats', auth, gameStats);

module.exports = router;
