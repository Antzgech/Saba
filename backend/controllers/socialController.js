const axios = require('axios');
const { User, SocialChannel } = require('../models');

/**
 * Verify YouTube subscription
 */
const verifyYouTubeSubscription = async (channelId, userAccessToken) => {
  try {
    // This requires user's YouTube access token (OAuth flow)
    // For demo purposes, we'll use API key and check public data
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/subscriptions`,
      {
        params: {
          part: 'snippet',
          forChannelId: channelId,
          mine: true,
          key: process.env.YOUTUBE_API_KEY
        },
        headers: {
          Authorization: `Bearer ${userAccessToken}`
        }
      }
    );
    
    return response.data.items && response.data.items.length > 0;
  } catch (error) {
    console.error('YouTube verification error:', error);
    return false;
  }
};

/**
 * Verify Telegram channel membership
 */
const verifyTelegramChannel = async (channelUsername, userId) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const response = await axios.get(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
      {
        params: {
          chat_id: `@${channelUsername}`,
          user_id: userId
        }
      }
    );
    
    const status = response.data.result.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    console.error('Telegram verification error:', error);
    return false;
  }
};

/**
 * @route   GET /api/social/channels
 * @desc    Get all active social channels
 * @access  Public
 */
exports.getChannels = async (req, res) => {
  try {
    const channels = await SocialChannel.findAll({
      where: { isActive: true },
      order: [['platform', 'ASC']]
    });
    
    res.json({
      success: true,
      data: { channels }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching channels',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/social/verify
 * @desc    Verify social media subscription
 * @access  Private
 */
exports.verifySubscription = async (req, res) => {
  try {
    const { platform, channelId, proof } = req.body;
    
    // Find the channel
    const channel = await SocialChannel.findOne({
      where: { platform, channelId, isActive: true }
    });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found or inactive'
      });
    }
    
    // Check if already subscribed
    const fieldMap = {
      YOUTUBE: 'youtubeSubscribed',
      TIKTOK: 'tiktokSubscribed',
      FACEBOOK: 'facebookSubscribed',
      TELEGRAM: 'telegramChannelJoined'
    };
    
    const field = fieldMap[platform];
    if (req.user[field]) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this platform'
      });
    }
    
    // Verify subscription based on platform
    let isVerified = false;
    
    switch (platform) {
      case 'YOUTUBE':
        // In production, implement OAuth flow to get user's access token
        // For now, manual verification or simplified check
        isVerified = channel.verificationMethod === 'MANUAL' ? true : false;
        break;
        
      case 'TELEGRAM':
        isVerified = await verifyTelegramChannel(channelId, req.user.telegramId);
        break;
        
      case 'TIKTOK':
      case 'FACEBOOK':
        // These require OAuth flows and user access tokens
        // For demo, use manual verification
        isVerified = channel.verificationMethod === 'MANUAL' ? true : false;
        break;
    }
    
    if (!isVerified && channel.verificationMethod !== 'MANUAL') {
      return res.status(400).json({
        success: false,
        message: 'Subscription could not be verified. Please ensure you are subscribed.'
      });
    }
    
    // Update user subscription status
    req.user[field] = true;
    await req.user.save();
    
    // Award points
    await req.user.addPoints(channel.pointsReward, `${platform}_SUBSCRIPTION`);
    
    res.json({
      success: true,
      message: 'Subscription verified successfully',
      data: {
        platform,
        pointsEarned: channel.pointsReward,
        totalPoints: req.user.totalPoints,
        currentLevel: req.user.currentLevel
      }
    });
  } catch (error) {
    console.error('Verify subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying subscription',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/social/unsubscribe
 * @desc    Handle unsubscription (deduct points)
 * @access  Private
 */
exports.handleUnsubscribe = async (req, res) => {
  try {
    const { platform } = req.body;
    
    const fieldMap = {
      YOUTUBE: 'youtubeSubscribed',
      TIKTOK: 'tiktokSubscribed',
      FACEBOOK: 'facebookSubscribed',
      TELEGRAM: 'telegramChannelJoined'
    };
    
    const field = fieldMap[platform];
    if (!req.user[field]) {
      return res.status(400).json({
        success: false,
        message: 'Not subscribed to this platform'
      });
    }
    
    // Find the channel to get point value
    const channel = await SocialChannel.findOne({
      where: { platform, isActive: true }
    });
    
    if (channel) {
      await req.user.deductPoints(channel.pointsReward, `${platform}_UNSUBSCRIPTION`);
    }
    
    // Update user subscription status
    req.user[field] = false;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Unsubscription processed',
      data: {
        platform,
        pointsDeducted: channel?.pointsReward || 0,
        totalPoints: req.user.totalPoints,
        currentLevel: req.user.currentLevel
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing unsubscription',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/social/status
 * @desc    Get user's subscription status
 * @access  Private
 */
exports.getSubscriptionStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        youtube: req.user.youtubeSubscribed,
        tiktok: req.user.tiktokSubscribed,
        facebook: req.user.facebookSubscribed,
        telegram: req.user.telegramChannelJoined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status',
      error: error.message
    });
  }
};
