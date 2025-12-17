const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SocialChannel = sequelize.define('SocialChannel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  platform: {
    type: DataTypes.ENUM('YOUTUBE', 'TIKTOK', 'FACEBOOK', 'TELEGRAM'),
    allowNull: false
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'channel_id'
  },
  channelName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'channel_name'
  },
  channelUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'channel_url'
  },
  pointsReward: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'points_reward'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  verificationMethod: {
    type: DataTypes.ENUM('API', 'MANUAL', 'BOT'),
    defaultValue: 'API',
    field: 'verification_method'
  }
}, {
  tableName: 'social_channels',
  indexes: [
    { fields: ['platform'] },
    { fields: ['is_active'] }
  ]
});

module.exports = SocialChannel;
