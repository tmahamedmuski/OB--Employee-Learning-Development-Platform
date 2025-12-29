const jwt = require('jsonwebtoken');

const generateToken = (userId, role = 'user') => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Missing JWT_SECRET env variable');
  }

  return jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
};

module.exports = generateToken;
