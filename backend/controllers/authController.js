const jwt = require('jsonwebtoken');
const querystring = require('querystring');
const { validate } = require('@telegram-apps/init-data-node');
const { User } = require('../models');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @route   POST /api/auth/telegram
 * @desc    Authenticate user via Telegram WebApp
 * @access  Public
 */
exports.telegramAuth = async (req, res) => {
  try {
    const { authData, referralCode } = req.body;

    if (!authData) {
      return res.status(400).json({
        success: false,
        message: "Missing Telegram authentication data"
      });
    }

    // ----------------------------------------------------
    // 1. Parse Telegram initData (query string format)
    // ----------------------------------------------------
    let parsedAuthData;
    try {
      parsedAuthData = querystring.parse(authData);

      if (parsedAuthData.user) {
        parsedAuthData.user = JSON.parse(parsedAuthData.user);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid authentication data format"
      });
    }

    // ----------------------------------------------------
    // 2. Verify Telegram WebApp signature (correct method)
    // ----------------------------------------------------
    try {
      validate(authData, process.env.TELEGRAM_BOT_TOKEN);
    } catch (e) {
      console.error("Telegram WebApp signature verification failed:", e);
      return res.status(401).json({
        success: false,
        message: "Invalid Telegram authentication"
      });
    }

    const tgUser = parsedAuthData.user;

    // ----------------------------------------------------
    // 3. Find or create user
    // ----------------------------------------------------
    let user = await User.findOne({ where: { telegramId: tgUser.id } });

    if (user) {
      // Update existing user
      user.username = tgUser.username || user.username;
      user.firstName = tgUser.first_name || user.firstName;
      user.lastName = tgUser.last_name || user.lastName;
      user.photoUrl = tgUser.photo_url || user.photoUrl;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        telegramId: tgUser.id,
        username: tgUser.username || "",
        firstName: tgUser.first_name || "",
        lastName: tgUser.last_name || "",
        photoUrl: tgUser.photo_url || "",
        referralCode: `REF${tgUser.id}${Math.random().toString(36).substring(2, 8)}`,
        totalPoints: 0,
        currentLevel: 1
      });

      // Handle referral
      if (referralCode) {
        const referrer = await User.findOne({ where: { referralCode } });
        if (referrer) {
          user.referredBy = referrer.id;
          await user.save();

          referrer.referralCount += 1;
          await referrer.addPoints(500, "REFERRAL_BONUS");
          await referrer.save();
        }
      }

      // Welcome bonus
      await user.addPoints(100, "WELCOME_BONUS");
    }

    // ----------------------------------------------------
    // 4. Generate JWT
    // ----------------------------------------------------
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: "Authenticated successfully",
      data: {
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
          totalPoints: user.totalPoints,
          currentLevel: user.currentLevel,
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          isAdmin: user.isAdmin
        }
      }
    });

  } catch (error) {
    console.error("Telegram auth error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Return authenticated user's profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
exports.refreshToken = async (req, res) => {
  try {
    const newToken = jwt.sign(
      { id: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh token"
    });
  }
};
