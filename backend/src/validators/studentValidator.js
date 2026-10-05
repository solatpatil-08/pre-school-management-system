const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createStudentValidator = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('class')
    .notEmpty()
    .withMessage('Class assignment is required')
    .isMongoId()
    .withMessage('Class must be a valid MongoDB ObjectId'),
  body('parent')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Parent must be a valid MongoDB ObjectId'),
  body('studentId')
    .optional({ checkFalsy: true })
    .trim(),
  body('admissionDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Admission date must be a valid date'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  body('contactNumber')
    .optional({ checkFalsy: true })
    .trim(),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('emergencyContact')
    .optional(),
  body('medicalNotes')
    .optional({ checkFalsy: true })
    .trim(),
  body('allergies')
    .optional({ checkFalsy: true })
    .trim(),
  body('bloodGroup')
    .optional({ checkFalsy: true })
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])
    .withMessage('Invalid blood group'),
  body('profilePhoto')
    .optional({ checkFalsy: true })
    .trim(),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Graduated', 'Suspended'])
    .withMessage('Status must be Active, Inactive, Graduated, or Suspended'),
  validate,
];

const updateStudentValidator = [
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
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('class')
    .optional()
    .isMongoId()
    .withMessage('Class must be a valid MongoDB ObjectId'),
  body('parent')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Parent must be a valid MongoDB ObjectId'),
  body('studentId')
    .optional({ checkFalsy: true })
    .trim(),
  body('admissionDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Admission date must be a valid date'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  body('contactNumber')
    .optional({ checkFalsy: true })
    .trim(),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('emergencyContact')
    .optional(),
  body('medicalNotes')
    .optional({ checkFalsy: true })
    .trim(),
  body('allergies')
    .optional({ checkFalsy: true })
    .trim(),
  body('bloodGroup')
    .optional({ checkFalsy: true })
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])
    .withMessage('Invalid blood group'),
  body('profilePhoto')
    .optional({ checkFalsy: true })
    .trim(),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Graduated', 'Suspended'])
    .withMessage('Status must be Active, Inactive, Graduated, or Suspended'),
  validate,
];

module.exports = {
  createStudentValidator,
  updateStudentValidator,
};
