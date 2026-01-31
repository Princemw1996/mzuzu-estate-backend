const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = (req, res) => {
  const { email, password } = req.body;

  console.log('=== LOGIN ATTEMPT ===');
  console.log('Email:', email);
  console.log('Password provided:', password);

  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      console.log('Users found:', result.length);
      
      if (result.length === 0) {
        console.log('No user found with email:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result[0];
      console.log('User found:', user.email);
      console.log('Stored password hash:', user.password);
      console.log('Password length:', user.password.length);
      
      try {
        // Check if password is a bcrypt hash (starts with $2)
        if (user.password.startsWith('$2')) {
          console.log('Comparing with bcrypt...');
          const match = await bcrypt.compare(password, user.password);
          console.log('Bcrypt comparison result:', match);
          
          if (!match) {
            console.log('Bcrypt password mismatch');
            return res.status(401).json({ message: 'Invalid credentials' });
          }
        } 
        // Check if password is plain text
        else if (password === user.password) {
          console.log('Plain text password match');
          // Hash the plain text password for future use
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, user.id],
            (updateErr) => {
              if (updateErr) {
                console.error('Error updating password hash:', updateErr);
              } else {
                console.log('Password hashed and updated in database');
              }
            }
          );
        } 
        // Password doesn't match
        else {
          console.log('Password does not match');
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            full_name: user.full_name 
          },
          'SECRET_KEY',
          { expiresIn: '1d' }
        );

        console.log('✅ Login successful for:', user.email);
        console.log('Token generated');
        
        res.json({ 
          success: true,
          message: 'Login successful',
          token: token,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          }
        });
        
      } catch (error) {
        console.error('Login process error:', error);
        res.status(500).json({ 
          success: false,
          message: 'Server error during login' 
        });
      }
    }
  );
};

module.exports = { login };