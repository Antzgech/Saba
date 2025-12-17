const { sequelize } = require('../config/database');
const User = require('./User');
const PointTransaction = require('./PointTransaction');
const GameSession = require('./GameSession');
const Reward = require('./Reward');
const SocialChannel = require('./SocialChannel');

// Define relationships

// User has many PointTransactions
User.hasMany(PointTransaction, {
  foreignKey: 'user_id',
  as: 'pointTransactions'
});
PointTransaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many GameSessions
User.hasMany(GameSession, {
  foreignKey: 'user_id',
  as: 'gameSessions'
});
GameSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many Rewards
User.hasMany(Reward, {
  foreignKey: 'user_id',
  as: 'rewards'
});
Reward.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Self-referential relationship for referrals
User.hasMany(User, {
  foreignKey: 'referred_by',
  as: 'referrals'
});
User.belongsTo(User, {
  foreignKey: 'referred_by',
  as: 'referrer'
});

// Sync models with database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database models synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  PointTransaction,
  GameSession,
  Reward,
  SocialChannel,
  syncDatabase
};
