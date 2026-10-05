const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createEventValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required'),
  body().custom((value) => {
    const d = value.date || value.eventDate;
    if (!d) {
      throw new Error('Event date is required');
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
  body('targetAudience')
    .optional()
    .customSanitizer((val) => {
      if (!val) return 'All';
      const lower = String(val).toLowerCase();
      if (lower === 'all') return 'All';
      if (lower === 'teacher') return 'Teacher';
      if (lower === 'parent') return 'Parent';
      if (lower === 'student') return 'Student';
      return val;
    })
    .isIn(['All', 'Teacher', 'Parent', 'Student'])
    .withMessage('Invalid target audience'),
  body('category')
    .optional()
    .customSanitizer((val) => {
      if (!val) return 'Academic';
      const lower = String(val).toLowerCase();
      if (lower === 'academic') return 'Academic';
      if (lower === 'sports') return 'Sports';
      if (lower === 'cultural') return 'Cultural';
      if (lower === 'holiday') return 'Holiday';
      if (lower === 'meeting') return 'Meeting';
      if (lower === 'workshop') return 'Workshop';
      return val;
    })
    .isIn(['Academic', 'Sports', 'Cultural', 'Holiday', 'Meeting', 'Workshop'])
    .withMessage('Invalid event category'),
  validate,
];

module.exports = {
  createEventValidator,
};
