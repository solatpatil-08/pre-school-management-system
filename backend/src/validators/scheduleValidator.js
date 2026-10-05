const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createScheduleValidator = [
  body('class')
    .notEmpty()
    .withMessage('Class ID is required')
    .isMongoId()
    .withMessage('Class must be a valid MongoDB ObjectId'),
  body('day')
    .optional({ checkFalsy: true })
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body('dayOfWeek')
    .optional({ checkFalsy: true })
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body()
    .custom((value, { req }) => {
      const hasDay = req.body.day || req.body.dayOfWeek;
      if (!hasDay) {
        throw new Error('Day of week is required');
      }
      return true;
    }),
  body('activity')
    .optional({ checkFalsy: true })
    .trim(),
  body('activityName')
    .optional({ checkFalsy: true })
    .trim(),
  body('subject')
    .optional({ checkFalsy: true })
    .trim(),
  body()
    .custom((value, { req }) => {
      const hasActivity = req.body.activity?.trim() || req.body.activityName?.trim() || req.body.subject?.trim();
      if (!hasActivity) {
        throw new Error('Activity / Subject name is required');
      }
      if (!req.body.activity && req.body.subject) {
        req.body.activity = req.body.subject;
      }
      return true;
    }),
  body('startTime')
    .trim()
    .notEmpty()
    .withMessage('Start time is required'),
  body('endTime')
    .trim()
    .notEmpty()
    .withMessage('End time is required'),
  body('teacher')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Teacher must be a valid MongoDB ObjectId'),
  body('room')
    .optional()
    .trim(),
  body('academicYear')
    .optional()
    .trim(),
  body('activityType')
    .optional()
    .isIn(['Academic', 'Play', 'Meal', 'Arts & Craft', 'Music & Movement', 'Nap/Rest', 'Outdoor'])
    .withMessage('Invalid activity type'),
  validate,
];

const updateScheduleValidator = [
  body('class')
    .optional()
    .isMongoId()
    .withMessage('Class must be a valid MongoDB ObjectId'),
  body('day')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body('dayOfWeek')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body('teacher')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Teacher must be a valid MongoDB ObjectId'),
  validate,
];

module.exports = {
  createScheduleValidator,
  updateScheduleValidator,
};
