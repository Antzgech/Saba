const express = require('express');
const router = express.Router();
const {
  getGlobalLeaderboard,
  getLevelLeaderboard,
  getUserRank,
  getAllLevelsLeaderboard,
  getLeaderboardStats
} = require('../controllers/leaderboardController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/global', optionalAuth, getGlobalLeaderboard);
router.get('/level/:level', optionalAuth, getLevelLeaderboard);
router.get('/user-rank', auth, getUserRank);
router.get('/all-levels', optionalAuth, getAllLevelsLeaderboard);
router.get('/stats', optionalAuth, getLeaderboardStats);

module.exports = router;
