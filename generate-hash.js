// generate-hash.js
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = '12345';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('====================================');
  console.log('Password: 12345');
  console.log('Generated Hash:', hash);
  console.log('====================================');
  
  // Also test if it would match
  const isValid = await bcrypt.compare('12345', hash);
  console.log('Password validation test:', isValid ? 'PASS ✓' : 'FAIL ✗');
}

generateHash();