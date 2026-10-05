const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates Bearer JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
        return res.status(401).json({
          success: false,
          message: 'No authorization token provided. Access denied.',
        });
      }

      // Verify token
      const decoded = jwt.verify(token, getJwtSecret());

      const userId = decoded.userId || decoded.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token payload. Authorization denied.',
        });
      }

      // Get user from token (exclude password)
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists. Authorization denied.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This user account has been deactivated.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
          isExpired: true,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token. Access denied.',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided. Access denied.',
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Restricts access to specified roles (e.g. 'ADMIN', 'TEACHER', 'PARENT')
 * Case-insensitive support for array or multiple arguments
 */
const authorizeRoles = (...roles) => {
  const allowed = roles.flat().map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  protect: authenticate,
  authorizeRoles,
  authorize: authorizeRoles,
};
