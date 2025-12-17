const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
 * Generate unique referral code
 */
const generateReferralCode = (telegramId) => {
  const random = crypto.randomBytes(4).toString('hex');
  return `REF${telegramId}${random}`.toUpperCase();
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
 * @desc    Authenticate user via Telegram
 * @access  Public
 */
exports.telegramAuth = async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName, photoUrl, authData, referralCode } = req.body;
    
    // Parse and verify Telegram auth data
    let parsedAuthData;
    try {
      parsedAuthData = JSON.parse(authData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid authentication data format'
      });
    }
    
    // Verify Telegram authentication (in production, always verify)
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyTelegramAuth(parsedAuthData);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Telegram authentication'
        });
      }
    }
    
    // Check if user exists
    let user = await User.findOne({ where: { telegramId } });
    
    if (user) {
      // Update existing user info
      user.username = username || user.username;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.photoUrl = photoUrl || user.photoUrl;
      await user.save();
    } else {
      // Create new user
      const newReferralCode = generateReferralCode(telegramId);
      
      user = await User.create({
        telegramId,
        username,
        firstName,
        lastName,
        photoUrl,
        referralCode: newReferralCode,
        totalPoints: 0,
        currentLevel: 1
      });
      
      // Handle referral if provided
      if (referralCode) {
        const referrer = await User.findOne({ where: { referralCode } });
        
        if (referrer) {
          user.referredBy = referrer.id;
          await user.save();
          
          // Award points to referrer
          await referrer.addPoints(500, 'REFERRAL_BONUS');
          referrer.referralCount += 1;
          await referrer.save();
        }
      }
      
      // Give welcome bonus
      await user.addPoints(100, 'WELCOME_BONUS');
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'User registered successfully' : 'User logged in successfully',
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
    console.error('Telegram auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
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
    const newToken = generateToken(req.user.id);
    
    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};
