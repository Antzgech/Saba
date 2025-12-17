const express = require('express');
const router = express.Router();
const {
  getReferralStats,
  getReferralLink,
  getReferralLeaderboard,
  validateReferralCode
} = require('../controllers/referralController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/stats', auth, getReferralStats);
router.get('/link', auth, getReferralLink);
router.get('/leaderboard', optionalAuth, getReferralLeaderboard);
router.post('/validate', validateReferralCode);

module.exports = router;
