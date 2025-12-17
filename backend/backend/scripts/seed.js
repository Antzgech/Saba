require('dotenv').config();
const { User, SocialChannel } = require('../models');
const { testConnection } = require('../config/database');

const seed = async () => {
  console.log('🌱 Seeding database...\n');
  
  try {
    await testConnection();
    
    // Create sample social channels
    console.log('Creating social channels...');
    
    const channels = [
      {
        platform: 'YOUTUBE',
        channelId: 'UCxxxxxx',
        channelName: 'Sample YouTube Channel',
        channelUrl: 'https://youtube.com/@samplechannel',
        pointsReward: 100,
        verificationMethod: 'MANUAL'
      },
      {
        platform: 'TELEGRAM',
        channelId: 'samplechannel',
        channelName: 'Sample Telegram Channel',
        channelUrl: 'https://t.me/samplechannel',
        pointsReward: 150,
        verificationMethod: 'BOT'
      },
      {
        platform: 'TIKTOK',
        channelId: '@sampleaccount',
        channelName: 'Sample TikTok Account',
        channelUrl: 'https://tiktok.com/@sampleaccount',
        pointsReward: 100,
        verificationMethod: 'MANUAL'
      }
    ];
    
    for (const channelData of channels) {
      await SocialChannel.findOrCreate({
        where: { platform: channelData.platform },
        defaults: channelData
      });
      console.log(`✓ ${channelData.platform} channel created`);
    }
    
    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Note: Update channel IDs and URLs in admin panel before going live.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
