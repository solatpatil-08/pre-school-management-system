const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createClassValidator = [
  body('name')
    .optional({ checkFalsy: true })
    .trim(),
  body('className')
    .optional({ checkFalsy: true })
    .trim(),
  body()
    .custom((value, { req }) => {
      const hasName = req.body.name?.trim() || req.body.className?.trim();
      if (!hasName) {
        throw new Error('Class name is required');
      }
      return true;
    }),
  body('roomNumber')
    .optional({ checkFalsy: true })
    .trim(),
  body('room')
    .optional({ checkFalsy: true })
    .trim(),
  body()
    .custom((value, { req }) => {
      const hasRoom = req.body.roomNumber?.trim() || req.body.room?.trim();
      if (!hasRoom) {
        throw new Error('Room / Room number is required');
      }
      return true;
    }),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be an integer between 1 and 100'),
  body('section')
    .optional()
    .trim(),
  body('academicYear')
    .optional()
    .trim(),
  body('teacher')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Teacher must be a valid MongoDB ObjectId'),
  body('classTeacher')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Class teacher must be a valid MongoDB ObjectId'),
  body('status')
    .optional()
    .isIn(['Active', 'Archived', 'Inactive'])
    .withMessage('Status must be Active, Archived, or Inactive'),
  validate,
];

const updateClassValidator = [
  body('name')
    .optional({ checkFalsy: true })
    .trim(),
  body('className')
    .optional({ checkFalsy: true })
    .trim(),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be an integer between 1 and 100'),
  body('teacher')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Teacher must be a valid MongoDB ObjectId'),
  body('classTeacher')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Class teacher must be a valid MongoDB ObjectId'),
  body('status')
    .optional()
    .isIn(['Active', 'Archived', 'Inactive'])
    .withMessage('Status must be Active, Archived, or Inactive'),
  validate,
];

module.exports = {
  createClassValidator,
  updateClassValidator,
};
