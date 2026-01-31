// reset-password.js
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'mzuzu_estate'
});

async function resetPassword() {
  try {
    const password = '12345';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('Password: 12345');
    console.log('Generated Hash:', hashedPassword);
    
    // Delete existing user
    db.query(
      'DELETE FROM users WHERE email = ?',
      ['princemwalughali7@gmail.com'],
      (err) => {
        if (err) {
          console.error('Error deleting user:', err);
        } else {
          console.log('Old user deleted');
        }
        
        // Insert new user
        db.query(
          'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
          ['princemwalughali7@gmail.com', hashedPassword, 'Prince Mwalughali', 'admin'],
          (err, result) => {
            if (err) {
              console.error('Error creating user:', err);
            } else {
              console.log('✅ User created successfully');
              console.log('User ID:', result.insertId);
            }
            
            // Verify
            db.query(
              'SELECT * FROM users WHERE email = ?',
              ['princemwalughali7@gmail.com'],
              (err, users) => {
                if (err) {
                  console.error('Error verifying:', err);
                } else {
                  console.log('📊 User in database:');
                  console.log(users[0]);
                }
                db.end();
              }
            );
          }
        );
      }
    );
    
  } catch (error) {
    console.error('Error:', error);
    db.end();
  }
}

resetPassword();