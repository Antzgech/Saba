const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  telegramId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'telegram_id'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_name'
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_url'
  },
  // Points and Level System
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_points'
  },
  currentLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'current_level'
  },
  // Game tracking
  lastGamePlayedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_game_played_at'
  },
  gamesPlayedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'games_played_count'
  },
  // Subscription tracking
  youtubeSubscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'youtube_subscribed'
  },
  tiktokSubscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'tiktok_subscribed'
  },
  facebookSubscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'facebook_subscribed'
  },
  telegramChannelJoined: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'telegram_channel_joined'
  },
  // Referral system
  referralCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'referral_code'
  },
  referredBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'referred_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  referralCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'referral_count'
  },
  // Admin flag
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_admin'
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['telegram_id'] },
    { fields: ['referral_code'] },
    { fields: ['current_level', 'total_points'] },
    { fields: ['referred_by'] }
  ]
});

// Instance methods
User.prototype.canPlayGame = function() {
  if (!this.lastGamePlayedAt) return true;
  
  const lastPlayed = new Date(this.lastGamePlayedAt);
  const now = new Date();
  const diffInHours = (now - lastPlayed) / (1000 * 60 * 60);
  
  return diffInHours >= 24;
};

User.prototype.addPoints = async function(points, reason) {
  this.totalPoints += points;
  await this.save();
  
  // Log the points transaction
  const PointTransaction = require('./PointTransaction');
  await PointTransaction.create({
    userId: this.id,
    points: points,
    reason: reason,
    type: 'CREDIT'
  });
  
  // Check for level up
  await this.checkLevelUp();
};

User.prototype.deductPoints = async function(points, reason) {
  this.totalPoints = Math.max(0, this.totalPoints - points);
  await this.save();
  
  const PointTransaction = require('./PointTransaction');
  await PointTransaction.create({
    userId: this.id,
    points: points,
    reason: reason,
    type: 'DEBIT'
  });
};

User.prototype.checkLevelUp = async function() {
  const levelThresholds = {
    1: 0,
    2: 1000,   // 1000 points to reach level 2
    3: 5000    // 5000 points to reach level 3
  };
  
  let newLevel = 1;
  for (const [level, threshold] of Object.entries(levelThresholds)) {
    if (this.totalPoints >= threshold) {
      newLevel = parseInt(level);
    }
  }
  
  if (newLevel > this.currentLevel) {
    const oldLevel = this.currentLevel;
    this.currentLevel = newLevel;
    await this.save();
    
    // Log level up event
    console.log(`User ${this.username} leveled up from ${oldLevel} to ${newLevel}`);
    return true;
  }
  
  return false;
};

module.exports = User;
