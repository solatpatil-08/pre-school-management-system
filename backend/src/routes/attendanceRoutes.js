const express = require('express');
const router = express.Router();
const {
  getAttendance,
  markAttendance,
  markBulkAttendance,
  getStudentAttendance,
  updateAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const {
  markSingleAttendanceValidator,
  markBulkAttendanceValidator,
  updateAttendanceValidator,
} = require('../validators/attendanceValidator');

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'teacher', 'parent'), getAttendance)
  .post(authorize('admin', 'teacher'), markSingleAttendanceValidator, markAttendance);

router.post(
  '/bulk',
  authorize('admin', 'teacher'),
  markBulkAttendanceValidator,
  markBulkAttendance
);

router.get(
  '/student/:studentId',
  authorize('admin', 'teacher', 'parent'),
  validateObjectId('studentId'),
  getStudentAttendance
);

router.put(
  '/:id',
  authorize('admin', 'teacher'),
  validateObjectId('id'),
  updateAttendanceValidator,
  updateAttendance
);

module.exports = router;
