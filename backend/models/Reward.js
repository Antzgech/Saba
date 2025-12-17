const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reward = sequelize.define('Reward', {
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
  level: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  periodStart: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'period_start'
  },
  periodEnd: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'period_end'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED'),
    defaultValue: 'PENDING'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at'
  },
  paymentReference: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'payment_reference'
  }
}, {
  tableName: 'rewards',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['period_start', 'period_end'] },
    { fields: ['status'] }
  ]
});

module.exports = Reward;
