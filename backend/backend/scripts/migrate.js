require('dotenv').config();
const { syncDatabase } = require('../models');
const { testConnection } = require('../config/database');

const migrate = async () => {
  console.log('🔄 Starting database migration...\n');
  
  try {
    // Test database connection
    console.log('1️⃣  Testing database connection...');
    await testConnection();
    
    // Synchronize all models
    console.log('\n2️⃣  Synchronizing database models...');
    await syncDatabase(false); // false = don't drop existing tables
    
    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Created/Updated tables:');
    console.log('   - users');
    console.log('   - point_transactions');
    console.log('   - game_sessions');
    console.log('   - rewards');
    console.log('   - social_channels\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

migrate();
