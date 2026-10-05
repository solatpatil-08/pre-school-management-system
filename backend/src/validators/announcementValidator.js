const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createAnnouncementValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Announcement title is required'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Announcement message is required'),
  body('targetRole')
    .optional()
    .customSanitizer((val) => {
      if (!val) return 'All';
      const lower = String(val).toLowerCase();
      if (lower === 'all') return 'All';
      if (lower === 'teacher') return 'Teacher';
      if (lower === 'parent') return 'Parent';
      return val;
    })
    .isIn(['All', 'Teacher', 'Parent'])
    .withMessage('Target role must be All, Teacher, or Parent'),
  body('status')
    .optional()
    .customSanitizer((val) => {
      if (!val) return 'Published';
      const lower = String(val).toLowerCase();
      if (lower === 'draft') return 'Draft';
      if (lower === 'published') return 'Published';
      if (lower === 'archived') return 'Archived';
      return val;
    })
    .isIn(['Draft', 'Published', 'Archived'])
    .withMessage('Status must be Draft, Published, or Archived'),
  body('priority')
    .optional()
    .customSanitizer((val) => {
      if (!val) return 'Normal';
      const lower = String(val).toLowerCase();
      if (lower === 'low') return 'Low';
      if (lower === 'normal') return 'Normal';
      if (lower === 'high') return 'High';
      if (lower === 'urgent') return 'Urgent';
      return val;
    })
    .isIn(['Low', 'Normal', 'High', 'Urgent'])
    .withMessage('Priority must be Low, Normal, High, or Urgent'),
  validate,
];

module.exports = {
  createAnnouncementValidator,
};
