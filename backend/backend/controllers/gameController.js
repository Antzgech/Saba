const { GameSession, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Calculate points based on game score
 */
const calculatePoints = (score) => {
  // Base points calculation: 1 point per 10 score
  const basePoints = Math.floor(score / 10);
  
  // Bonus for high scores
  let bonus = 0;
  if (score >= 1000) bonus = 100;
  else if (score >= 500) bonus = 50;
  else if (score >= 200) bonus = 20;
  
  return basePoints + bonus;
};

/**
 * @route   GET /api/game/can-play
 * @desc    Check if user can play game today
 * @access  Private
 */
exports.canPlay = async (req, res) => {
  try {
    const canPlay = req.user.canPlayGame();
    
    let nextPlayTime = null;
    if (!canPlay && req.user.lastGamePlayedAt) {
      const lastPlayed = new Date(req.user.lastGamePlayedAt);
      nextPlayTime = new Date(lastPlayed.getTime() + 24 * 60 * 60 * 1000);
    }
    
    res.json({
      success: true,
      data: {
        canPlay,
        lastGamePlayedAt: req.user.lastGamePlayedAt,
        nextPlayTime,
        gamesPlayedCount: req.user.gamesPlayedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking game eligibility',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/game/start
 * @desc    Start a new game session
 * @access  Private
 */
exports.startGame = async (req, res) => {
  try {
    // Check if user can play
    if (!req.user.canPlayGame()) {
      return res.status(403).json({
        success: false,
        message: 'You can only play once per 24 hours'
      });
    }
    
    // Create game session
    const gameSession = await GameSession.create({
      userId: req.user.id,
      score: 0,
      pointsEarned: 0,
      durationSeconds: 0
    });
    
    res.json({
      success: true,
      message: 'Game session started',
      data: {
        sessionId: gameSession.id,
        startTime: gameSession.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting game',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/game/complete
 * @desc    Complete game session and award points
 * @access  Private
 */
exports.completeGame = async (req, res) => {
  try {
    const { score, durationSeconds } = req.body;
    
    // Validate duration (max 10 minutes)
    if (durationSeconds > 600) {
      return res.status(400).json({
        success: false,
        message: 'Game duration exceeds maximum limit of 10 minutes'
      });
    }
    
    // Find the most recent incomplete game session
    const gameSession = await GameSession.findOne({
      where: {
        userId: req.user.id,
        completedAt: null
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'No active game session found'
      });
    }
    
    // Calculate points earned
    const pointsEarned = calculatePoints(score);
    
    // Update game session
    gameSession.score = score;
    gameSession.pointsEarned = pointsEarned;
    gameSession.durationSeconds = durationSeconds;
    gameSession.completedAt = new Date();
    await gameSession.save();
    
    // Update user
    await req.user.addPoints(pointsEarned, 'GAME_COMPLETED');
    req.user.lastGamePlayedAt = new Date();
    req.user.gamesPlayedCount += 1;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Game completed successfully',
      data: {
        score,
        pointsEarned,
        totalPoints: req.user.totalPoints,
        currentLevel: req.user.currentLevel
      }
    });
  } catch (error) {
    console.error('Complete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing game',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/game/history
 * @desc    Get user's game history
 * @access  Private
 */
exports.gameHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: sessions } = await GameSession.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        sessions,
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
      message: 'Error fetching game history',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/game/stats
 * @desc    Get user's game statistics
 * @access  Private
 */
exports.gameStats = async (req, res) => {
  try {
    const sessions = await GameSession.findAll({
      where: {
        userId: req.user.id,
        completedAt: { [Op.not]: null }
      }
    });
    
    const totalGames = sessions.length;
    const totalScore = sessions.reduce((sum, session) => sum + session.score, 0);
    const totalPoints = sessions.reduce((sum, session) => sum + session.pointsEarned, 0);
    const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
    const highScore = totalGames > 0 ? Math.max(...sessions.map(s => s.score)) : 0;
    
    res.json({
      success: true,
      data: {
        totalGames,
        totalScore,
        totalPointsFromGames: totalPoints,
        averageScore,
        highScore,
        lastPlayed: req.user.lastGamePlayedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching game stats',
      error: error.message
    });
  }
};
