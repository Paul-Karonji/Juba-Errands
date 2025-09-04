// backend/database/migrate.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  let connection;
  
  try {
    console.log('🚀 Starting database migrations...');
    console.log('📍 Database:', process.env.DB_NAME);
    console.log('👤 User:', process.env.DB_USER);
    console.log('🏠 Host:', process.env.DB_HOST);
    
    // First connect without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    console.log('📝 Creating database if not exists...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'juba_errands_nairobi'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'juba_errands_nairobi'}`);
    
    console.log('✅ Database selected');
    
    // Read and execute the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        // Skip CREATE DATABASE and USE statements since we handled them above
        if (statement.trim().toUpperCase().startsWith('CREATE DATABASE') || 
            statement.trim().toUpperCase().startsWith('USE ')) {
          continue;
        }
        
        console.log('Executing:', statement.substring(0, 50).replace(/\s+/g, ' ') + '...');
        await connection.query(statement);
      }
    }
    
    console.log('✅ Database migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

runMigrations();