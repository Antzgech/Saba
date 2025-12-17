const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'points_earned'
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_seconds',
    validate: {
      max: 600 // Maximum 10 minutes (600 seconds)
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  isValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_valid'
  }
}, {
  tableName: 'game_sessions',
  indexes: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['completed_at'] }
  ]
});

module.exports = GameSession;
