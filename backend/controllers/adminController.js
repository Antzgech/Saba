const { SocialChannel, User, Reward, PointTransaction, GameSession } = require('../models');
const { Op } = require('sequelize');

/**
 * @route   POST /api/admin/channels
 * @desc    Create a new social channel
 * @access  Admin
 */
exports.createChannel = async (req, res) => {
  try {
    const { platform, channelId, channelName, channelUrl, pointsReward, verificationMethod } = req.body;
    
    // Check if channel already exists
    const existingChannel = await SocialChannel.findOne({
      where: { platform, channelId }
    });
    
    if (existingChannel) {
      return res.status(400).json({
        success: false,
        message: 'Channel already exists'
      });
    }
    
    const channel = await SocialChannel.create({
      platform,
      channelId,
      channelName,
      channelUrl,
      pointsReward,
      verificationMethod
    });
    
    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: { channel }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating channel',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/admin/channels/:id
 * @desc    Update a social channel
 * @access  Admin
 */
exports.updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const channel = await SocialChannel.findByPk(id);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }
    
    await channel.update(updates);
    
    res.json({
      success: true,
      message: 'Channel updated successfully',
      data: { channel }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating channel',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/admin/channels/:id
 * @desc    Delete a social channel
 * @access  Admin
 */
exports.deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const channel = await SocialChannel.findByPk(id);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }
    
    await channel.destroy();
    
    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting channel',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/channels
 * @desc    Get all channels (including inactive)
 * @access  Admin
 */
exports.getAllChannels = async (req, res) => {
  try {
    const channels = await SocialChannel.findAll({
      order: [['platform', 'ASC'], ['createdAt', 'DESC']]
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
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, level } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { telegramId: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (level) {
      where.currentLevel = parseInt(level);
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where,
      order: [['totalPoints', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (admin only)
 * @access  Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalPoints, currentLevel, isActive, isAdmin } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (totalPoints !== undefined) user.totalPoints = totalPoints;
    if (currentLevel !== undefined) user.currentLevel = currentLevel;
    if (isActive !== undefined) user.isActive = isActive;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const totalGames = await GameSession.count();
    const totalRewards = await Reward.sum('amount') || 0;
    
    const usersByLevel = {
      level1: await User.count({ where: { currentLevel: 1 } }),
      level2: await User.count({ where: { currentLevel: 2 } }),
      level3: await User.count({ where: { currentLevel: 3 } })
    };
    
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'username', 'firstName', 'totalPoints', 'currentLevel', 'createdAt']
    });
    
    const topEarners = await User.findAll({
      order: [['totalPoints', 'DESC']],
      limit: 10,
      attributes: ['id', 'username', 'firstName', 'totalPoints', 'currentLevel']
    });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalGames,
        totalRewards,
        usersByLevel,
        recentUsers,
        topEarners
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/admin/rewards
 * @desc    Get all reward distributions
 * @access  Admin
 */
exports.getRewards = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const { count, rows: rewards } = await Reward.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'telegramId']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        rewards,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rewards',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/admin/rewards/:id/status
 * @desc    Update reward status
 * @access  Admin
 */
exports.updateRewardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentReference } = req.body;
    
    const reward = await Reward.findByPk(id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    reward.status = status;
    if (paymentReference) {
      reward.paymentReference = paymentReference;
    }
    if (status === 'PAID') {
      reward.paidAt = new Date();
    }
    
    await reward.save();
    
    res.json({
      success: true,
      message: 'Reward status updated',
      data: { reward }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating reward status',
      error: error.message
    });
  }
};
