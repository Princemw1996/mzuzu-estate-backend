const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Setting up database tables...');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        property_type VARCHAR(50) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        bedrooms INTEGER DEFAULT 0,
        bathrooms INTEGER DEFAULT 0,
        size VARCHAR(50),
        features TEXT,
        status VARCHAR(20) DEFAULT 'Available',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_images (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        image_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        client_name VARCHAR(100) NOT NULL,
        client_phone VARCHAR(20) NOT NULL,
        client_email VARCHAR(100),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables created successfully!');

    // Create admin user
    const hashedPassword = await bcrypt.hash('12345', 10);
    
    await pool.query(
      `INSERT INTO users (email, password, full_name, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password = $2, full_name = $3`,
      ['princemwalughali7@gmail.com', hashedPassword, 'Prince Mwalughali', 'admin']
    );

    console.log('✅ Admin user created/updated');
    console.log('📋 Login credentials:');
    console.log('   Email: princemwalughali7@gmail.com');
    console.log('   Password: 12345');

    // Add sample properties
    await pool.query(`
      INSERT INTO properties (title, property_type, price, location, description, bedrooms, bathrooms, size, status)
      VALUES 
      ('Beautiful 3 Bedroom House', 'house', 2500000, 'Mzuzu City Center', 'Modern house with 3 bedrooms, 2 bathrooms, garden, and security', 3, 2, '1200 sqft', 'Available'),
      ('Modern Apartment', 'apartment', 1200000, 'Katoto', 'Fully furnished apartment with great views', 2, 1, '800 sqft', 'Available'),
      ('Commercial Space', 'commercial', 3500000, 'Mzuzu CBD', 'Prime commercial space for business', 0, 1, '2000 sqft', 'Available')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Sample properties added');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

setupDatabase();