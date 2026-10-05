const { body } = require('express-validator');
const validate = require('../middleware/validate');

const validStatuses = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'LEAVE',
  'Present',
  'Absent',
  'Late',
  'Leave',
];

const markSingleAttendanceValidator = [
  body().custom((val, { req }) => {
    const student = req.body.student || req.body.studentId;
    if (!student || !/^[0-9a-fA-F]{24}$/.test(String(student))) {
      throw new Error('Valid student ID is required');
    }
    const cls = req.body.class || req.body.classId;
    if (!cls || !/^[0-9a-fA-F]{24}$/.test(String(cls))) {
      throw new Error('Valid class ID is required');
    }
    if (!req.body.date) {
      throw new Error('Attendance date is required');
    }
    const status = (req.body.status || '').toUpperCase();
    if (!['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].includes(status)) {
      throw new Error('Status must be PRESENT, ABSENT, LATE, or LEAVE');
    }
    return true;
  }),
  body('remarks').optional().trim(),
  validate,
];

const markBulkAttendanceValidator = [
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isMongoId()
    .withMessage('Class ID must be a valid MongoDB ObjectId'),
  body('date').notEmpty().withMessage('Attendance date is required'),
  body().custom((val, { req }) => {
    const items = req.body.attendanceData || req.body.records;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Attendance data must be a non-empty array (pass as attendanceData or records)');
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const studentId = item.studentId || item.student;
      if (!studentId || !/^[0-9a-fA-F]{24}$/.test(String(studentId))) {
        throw new Error(`Valid student ID is required at item index ${i}`);
      }
      const st = (item.status || '').toUpperCase();
      if (!['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].includes(st)) {
        throw new Error(`Status at item index ${i} must be PRESENT, ABSENT, LATE, or LEAVE`);
      }
    }
    return true;
  }),
  validate,
];

const updateAttendanceValidator = [
  body('status')
    .optional()
    .isIn(validStatuses)
    .withMessage('Status must be PRESENT, ABSENT, LATE, or LEAVE'),
  body('remarks').optional().trim(),
  body('date').optional(),
  body('class')
    .optional()
    .isMongoId()
    .withMessage('Class ID must be a valid MongoDB ObjectId'),
  validate,
];

module.exports = {
  markSingleAttendanceValidator,
  markBulkAttendanceValidator,
  updateAttendanceValidator,
};
