const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * @route   GET /api/leaderboard/global
 * @desc    Get global leaderboard (all levels)
 * @access  Public
 */
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const topUsers = await User.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'username',
        'firstName',
        'lastName',
        'photoUrl',
        'totalPoints',
        'currentLevel',
        'gamesPlayedCount'
      ],
      order: [
        ['totalPoints', 'DESC'],
        ['createdAt', 'ASC']
      ],
      limit: parseInt(limit)
    });
    
    // Add rank to each user
    const leaderboard = topUsers.map((user, index) => ({
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
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/leaderboard/level/:level
 * @desc    Get leaderboard for specific level
 * @access  Public
 */
exports.getLevelLeaderboard = async (req, res) => {
  try {
    const { level } = req.params;
    const { limit = 10 } = req.query;
    
    if (![1, 2, 3].includes(parseInt(level))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level. Must be 1, 2, or 3'
      });
    }
    
    const topUsers = await User.findAll({
      where: {
        currentLevel: parseInt(level),
        isActive: true
      },
      attributes: [
        'id',
        'username',
        'firstName',
        'lastName',
        'photoUrl',
        'totalPoints',
        'currentLevel',
        'gamesPlayedCount'
      ],
      order: [
        ['totalPoints', 'DESC'],
        ['createdAt', 'ASC']
      ],
      limit: parseInt(limit)
    });
    
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      ...user.toJSON()
    }));
    
    res.json({
      success: true,
      data: {
        level: parseInt(level),
        leaderboard
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching level leaderboard',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/leaderboard/user-rank
 * @desc    Get current user's rank in their level
 * @access  Private
 */
exports.getUserRank = async (req, res) => {
  try {
    const userLevel = req.user.currentLevel;
    
    // Get all users in the same level with higher or equal points
    const higherRankedCount = await User.count({
      where: {
        currentLevel: userLevel,
        isActive: true,
        [Op.or]: [
          { totalPoints: { [Op.gt]: req.user.totalPoints } },
          {
            totalPoints: req.user.totalPoints,
            createdAt: { [Op.lt]: req.user.createdAt }
          }
        ]
      }
    });
    
    const rank = higherRankedCount + 1;
    
    // Get total users in level
    const totalUsersInLevel = await User.count({
      where: {
        currentLevel: userLevel,
        isActive: true
      }
    });
    
    res.json({
      success: true,
      data: {
        rank,
        level: userLevel,
        totalPoints: req.user.totalPoints,
        totalUsersInLevel,
        isTopTen: rank <= 10
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user rank',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/leaderboard/all-levels
 * @desc    Get top 10 from each level
 * @access  Public
 */
exports.getAllLevelsLeaderboard = async (req, res) => {
  try {
    const leaderboards = {};
    
    for (let level = 1; level <= 3; level++) {
      const topUsers = await User.findAll({
        where: {
          currentLevel: level,
          isActive: true
        },
        attributes: [
          'id',
          'username',
          'firstName',
          'lastName',
          'photoUrl',
          'totalPoints',
          'currentLevel'
        ],
        order: [
          ['totalPoints', 'DESC'],
          ['createdAt', 'ASC']
        ],
        limit: 10
      });
      
      leaderboards[`level${level}`] = topUsers.map((user, index) => ({
        rank: index + 1,
        ...user.toJSON()
      }));
    }
    
    res.json({
      success: true,
      data: leaderboards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all levels leaderboard',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/leaderboard/stats
 * @desc    Get leaderboard statistics
 * @access  Public
 */
exports.getLeaderboardStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.count({ where: { isActive: true } }),
      level1Users: await User.count({ where: { currentLevel: 1, isActive: true } }),
      level2Users: await User.count({ where: { currentLevel: 2, isActive: true } }),
      level3Users: await User.count({ where: { currentLevel: 3, isActive: true } })
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard stats',
      error: error.message
    });
  }
};
