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
    .custom((val) => {
      if (!val) return true;
      if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) return true;
      if (typeof val === 'object') return true;
      throw new Error('Parent must be a valid ID or parent object');
    }),
  body('parentData')
    .optional()
    .isObject()
    .withMessage('Parent data must be an object'),
  body('feeData')
    .optional()
    .isObject()
    .custom((fee) => {
      if (!fee) return true;
      const total = Number(fee.totalPayableFees !== undefined ? fee.totalPayableFees : (fee.annualFees || fee.amount || 0));
      const paid = Number(fee.amountPaid !== undefined ? fee.amountPaid : (fee.paidAmount || 0));
      if (total < 0 || paid < 0) {
        throw new Error('Fee amounts cannot be negative');
      }
      if (paid > total && total > 0) {
        throw new Error('Amount paid cannot exceed total payable fees');
      }
      return true;
    }),
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
