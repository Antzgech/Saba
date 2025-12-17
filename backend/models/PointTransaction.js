const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PointTransaction = sequelize.define('PointTransaction', {
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
  points: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('CREDIT', 'DEBIT'),
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'point_transactions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = PointTransaction;
