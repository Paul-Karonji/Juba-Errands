// backend/config/database.js
require('dotenv').config(); // Add this line at the top
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'juba_errands_nairobi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Remove these invalid options for mysql2
  // acquireTimeout: 60000,
  // timeout: 60000,
  // reconnect: true
};

const pool = mysql.createPool(dbConfig);

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected to:', dbConfig.database);
    console.log('✅ Connected as user:', dbConfig.user);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('❌ Config being used:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '***hidden***' : 'NO PASSWORD SET'
    });
    process.exit(1);
  }
};

module.exports = { pool, connectDB };