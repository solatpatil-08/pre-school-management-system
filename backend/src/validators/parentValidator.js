const { body } = require('express-validator');
const validate = require('../middleware/validate');
const createParentValidator = [
  body('firstName')
    .optional({ checkFalsy: true })
    .trim(),
  body('lastName')
    .optional({ checkFalsy: true })
    .trim(),
  body('name')
    .optional({ checkFalsy: true })
    .trim(),
  body()
    .custom((value, { req }) => {
      if (!req.body.firstName && req.body.name) {
        const parts = req.body.name.trim().split(/\s+/);
        req.body.firstName = parts[0] || 'Parent';
        req.body.lastName = parts.slice(1).join(' ') || 'User';
      }
      if (!req.body.firstName) {
        throw new Error('First name or full name is required');
      }
      if (!req.body.lastName) {
        req.body.lastName = 'Parent';
      }
      return true;
    }),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone number is required'),
  body('children')
    .optional()
    .isArray()
    .withMessage('Children must be an array of student IDs'),
  body('children.*')
    .optional()
    .isMongoId()
    .withMessage('Child ID must be a valid MongoDB ObjectId'),
  validate,
];

const updateParentValidator = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('children')
    .optional()
    .isArray()
    .withMessage('Children must be an array of student IDs'),
  body('children.*')
    .optional()
    .isMongoId()
    .withMessage('Child ID must be a valid MongoDB ObjectId'),
  validate,
];

module.exports = {
  createParentValidator,
  updateParentValidator,
};
