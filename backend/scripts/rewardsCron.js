require('dotenv').config();
const cron = require('node-cron');
const { User, Reward, sequelize } = require('../models');
const { Op } = require('sequelize');

const getRewardPeriod = () => {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setHours(23, 59, 59, 999);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - (parseInt(process.env.REWARD_INTERVAL_DAYS) || 15));
  periodStart.setHours(0, 0, 0, 0);
  return { periodStart, periodEnd };
};

const calculateRewards = async () => {
  console.log('🏆 Starting reward calculation...');
  const { periodStart, periodEnd } = getRewardPeriod();
  const transaction = await sequelize.transaction();
  
  try {
    const rewardAmounts = {
      1: parseFloat(process.env.LEVEL_1_REWARD) || 3,
      2: parseFloat(process.env.LEVEL_2_REWARD) || 5,
      3: parseFloat(process.env.LEVEL_3_REWARD) || 10
    };
    
    let totalRewardsCreated = 0;
    
    for (let level = 1; level <= 3; level++) {
      const topUsers = await User.findAll({
        where: { currentLevel: level, isActive: true },
        order: [['totalPoints', 'DESC'], ['createdAt', 'ASC']],
        limit: 10,
        transaction
      });
      
      let cumulativeReward = 0;
      for (let i = 1; i <= level; i++) {
        cumulativeReward += rewardAmounts[i];
      }
      
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const existingReward = await Reward.findOne({
          where: {
            userId: user.id,
            level: level,
            periodStart: periodStart,
            periodEnd: periodEnd
          },
          transaction
        });
        
        if (!existingReward) {
          await Reward.create({
            userId: user.id,
            level: level,
            amount: cumulativeReward,
            rank: i + 1,
            periodStart: periodStart,
            periodEnd: periodEnd,
            status: 'PENDING'
          }, { transaction });
          totalRewardsCreated++;
        }
      }
    }
    
    await transaction.commit();
    console.log(`✅ Created ${totalRewardsCreated} rewards`);
    return { success: true, totalRewardsCreated };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error:', error);
    throw error;
  }
};

const scheduleRewardDistribution = () => {
  const intervalDays = parseInt(process.env.REWARD_INTERVAL_DAYS) || 15;
  const cronExpression = `0 0 */${intervalDays} * *`;
  cron.schedule(cronExpression, async () => {
    console.log('⏰ Running reward distribution...');
    try {
      await calculateRewards();
    } catch (error) {
      console.error('Cron error:', error);
    }
  });
  console.log('✅ Cron job scheduled');
};

module.exports = { calculateRewards, scheduleRewardDistribution };

if (require.main === module) {
  (async () => {
    try {
      const { testConnection } = require('../config/database');
      await testConnection();
      await calculateRewards();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}
