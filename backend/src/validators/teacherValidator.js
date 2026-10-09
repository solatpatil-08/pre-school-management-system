const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createTeacherValidator = [
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
        req.body.firstName = parts[0] || 'Teacher';
        req.body.lastName = parts.slice(1).join(' ') || 'User';
      }
      if (!req.body.firstName) {
        throw new Error('First name or full name is required');
      }
      if (!req.body.lastName) {
        req.body.lastName = 'Teacher';
      }
      return true;
    }),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('teacherId')
    .optional({ checkFalsy: true })
    .trim(),
  body('employeeId')
    .optional({ checkFalsy: true })
    .trim(),
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('qualification')
    .optional({ checkFalsy: true })
    .trim(),
  body('joiningDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Joining date must be a valid date'),
  body('designation')
    .optional({ checkFalsy: true })
    .trim(),
  body('specialization')
    .optional({ checkFalsy: true })
    .trim(),
  body('assignedClasses')
    .optional()
    .isArray()
    .withMessage('Assigned classes must be an array of class IDs'),
  body('assignedClasses.*')
    .optional()
    .isMongoId()
    .withMessage('Each assigned class must be a valid MongoDB ObjectId'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('profilePhoto')
    .optional({ checkFalsy: true })
    .trim(),
  body('status')
    .optional({ checkFalsy: true })
    .isIn(['Active', 'On Leave', 'Resigned', 'Inactive'])
    .withMessage('Status must be Active, On Leave, Resigned, or Inactive'),
  validate,
];

const updateTeacherValidator = [
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
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone')
    .optional()
    .trim(),
  body('teacherId')
    .optional({ checkFalsy: true })
    .trim(),
  body('employeeId')
    .optional({ checkFalsy: true })
    .trim(),
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('qualification')
    .optional({ checkFalsy: true })
    .trim(),
  body('joiningDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Joining date must be a valid date'),
  body('designation')
    .optional({ checkFalsy: true })
    .trim(),
  body('specialization')
    .optional({ checkFalsy: true })
    .trim(),
  body('assignedClasses')
    .optional()
    .isArray()
    .withMessage('Assigned classes must be an array of class IDs'),
  body('assignedClasses.*')
    .optional()
    .isMongoId()
    .withMessage('Each assigned class must be a valid MongoDB ObjectId'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('profilePhoto')
    .optional({ checkFalsy: true })
    .trim(),
  body('status')
    .optional({ checkFalsy: true })
    .isIn(['Active', 'On Leave', 'Resigned', 'Inactive'])
    .withMessage('Status must be Active, On Leave, Resigned, or Inactive'),
  validate,
];

module.exports = {
  createTeacherValidator,
  updateTeacherValidator,
};
