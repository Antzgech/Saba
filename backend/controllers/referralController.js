const { User } = require('../models');

/**
 * @route   GET /api/referrals/stats
 * @desc    Get user's referral statistics
 * @access  Private
 */
exports.getReferralStats = async (req, res) => {
  try {
    // Get all users referred by current user
    const referrals = await User.findAll({
      where: { referredBy: req.user.id },
      attributes: [
        'id',
        'username',
        'firstName',
        'totalPoints',
        'currentLevel',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate total points earned from referrals
    const pointsPerReferral = 500; // As defined in authController
    const totalPointsFromReferrals = referrals.length * pointsPerReferral;
    
    res.json({
      success: true,
      data: {
        referralCode: req.user.referralCode,
        totalReferrals: req.user.referralCount,
        activeReferrals: referrals.length,
        totalPointsEarned: totalPointsFromReferrals,
        referrals: referrals.map(ref => ({
          id: ref.id,
          name: ref.firstName || ref.username,
          level: ref.currentLevel,
          points: ref.totalPoints,
          joinedAt: ref.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching referral stats',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/referrals/link
 * @desc    Get referral link
 * @access  Private
 */
exports.getReferralLink = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${frontendUrl}?ref=${req.user.referralCode}`;
    const telegramBotUsername = process.env.TELEGRAM_BOT_USERNAME;
    const telegramLink = `https://t.me/${telegramBotUsername}?start=${req.user.referralCode}`;
    
    res.json({
      success: true,
      data: {
        referralCode: req.user.referralCode,
        referralLink,
        telegramLink,
        shareMessage: `🎮 Join me on Telegram Rewards! Play games, earn points, and win cash prizes! Use my referral code: ${req.user.referralCode}\n\n${telegramLink}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating referral link',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/referrals/leaderboard
 * @desc    Get referral leaderboard (users with most referrals)
 * @access  Public
 */
exports.getReferralLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const topReferrers = await User.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'username',
        'firstName',
        'photoUrl',
        'referralCount',
        'totalPoints'
      ],
      order: [
        ['referralCount', 'DESC'],
        ['totalPoints', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    const leaderboard = topReferrers.map((user, index) => ({
      rank: index + 1,
      ...user.toJSON()
    }));
    
    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching referral leaderboard',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/referrals/validate
 * @desc    Validate a referral code
 * @access  Public
 */
exports.validateReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;
    
    const referrer = await User.findOne({
      where: { referralCode, isActive: true },
      attributes: ['id', 'username', 'firstName', 'photoUrl']
    });
    
    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }
    
    res.json({
      success: true,
      data: {
        valid: true,
        referrer: {
          name: referrer.firstName || referrer.username,
          photoUrl: referrer.photoUrl
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating referral code',
      error: error.message
    });
  }
};
