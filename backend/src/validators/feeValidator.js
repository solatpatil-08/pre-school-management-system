const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createFeeValidator = [
  body('student')
    .optional()
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),
  body('studentId')
    .optional()
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),
  body('classId')
    .optional()
    .isMongoId()
    .withMessage('Class ID must be a valid MongoDB ObjectId'),
  body().custom((value) => {
    if (!value.student && !value.studentId && !value.classId) {
      throw new Error('Either student or class is required to assign fee');
    }
    const amt = value.amount !== undefined ? value.amount : value.totalAmount;
    if (amt === undefined || amt === null || isNaN(Number(amt)) || Number(amt) < 0) {
      throw new Error('Valid fee amount is required');
    }
    return true;
  }),
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required'),
  validate,
];

const updateFeeValidator = [
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be positive'),
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be positive'),
  validate,
];

const recordPaymentValidator = [
  body('amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than zero'),
  body('paymentMethod')
    .optional()
    .isString()
    .withMessage('Payment method must be a valid string'),
  validate,
];

module.exports = {
  createFeeValidator,
  updateFeeValidator,
  recordPaymentValidator,
};
