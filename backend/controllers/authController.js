const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const querystring = require('querystring');
const { User } = require('../models');

/**
 * Verify Telegram authentication data
 */
const verifyTelegramAuth = (authData) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    const dataCheckString = Object.keys(authData)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${authData[key]}`)
      .join('\n');

    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return hash === authData.hash;
  } catch (error) {
    console.error('Telegram auth verification error:', error);
    return false;
  }
};

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

      // user is still a JSON string → parse it
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
    // 2. Verify Telegram signature (production only)
    // ----------------------------------------------------
    if (process.env.NODE_ENV === "production") {
      const isValid = verifyTelegramAuth(parsedAuthData);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid Telegram authentication"
        });
      }
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
        referralCode: `REF${tgUser.id}${crypto.randomBytes(3).toString('hex')}`,
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
