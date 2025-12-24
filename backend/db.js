const { Pool } = require('pg');
require('dotenv').config();

// Railway provides the DATABASE_URL environment variable automatically
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Railway's secure connection
  }
});

/**
 * Initializes the database schema for SABA users.
 */
const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      first_name TEXT NOT NULL,
      username TEXT,
      photo_url TEXT,
      points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log("✅ PostgreSQL: Users table verified/created.");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  }
};

module.exports = { pool, initDb };
