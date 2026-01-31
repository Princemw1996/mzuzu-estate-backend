const mysql = require('mysql2');

// Use environment variables for production
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'mzuzu_estate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
};

const db = mysql.createPool(dbConfig);

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('Check Render database environment variables:');
      console.error('1. DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    }
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

module.exports = db;