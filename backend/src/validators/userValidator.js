const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('User name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'teacher', 'parent'])
    .withMessage('Role must be admin, teacher, or parent'),
  validate,
];

module.exports = {
  createUserValidator,
};
