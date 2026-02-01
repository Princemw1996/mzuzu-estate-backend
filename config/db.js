// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

let poolConfig;

if (isProduction) {
  // For Render PostgreSQL
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // For local development
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'mzuzu_estate',
    port: process.env.DB_PORT || 5432
  };
}

const pool = new Pool(poolConfig);

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('If using Render PostgreSQL:');
    console.error('1. Go to Render Dashboard');
    console.error('2. Navigate to your service');
    console.error('3. Click on "Environment" tab');
    console.error('4. Add DATABASE_URL from your PostgreSQL database');
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};