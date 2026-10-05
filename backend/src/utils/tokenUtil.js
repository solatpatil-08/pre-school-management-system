const jwt = require('jsonwebtoken');
const { getJwtSecret, getJwtExpiresIn } = require('../config/jwt');

const generateToken = (userId, role) => {
  return jwt.sign(
    {
      userId: userId.toString(),
      id: userId.toString(),
      role: (role || 'parent').toLowerCase(),
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn(),
    }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken,
};
