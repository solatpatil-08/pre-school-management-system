const { param } = require('express-validator');
const validate = require('../middleware/validate');

/**
 * Validate that a route parameter is a valid MongoDB ObjectId
 * @param {string} paramName - Parameter name in route (default: 'id')
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}: Must be a valid 24-character hexadecimal MongoDB ObjectId`),
  validate,
];

module.exports = {
  validateObjectId,
};
