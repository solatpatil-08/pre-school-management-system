const express = require('express');
const router = express.Router();
const {
  getSummaryReport,
  getAttendanceReport,
  getFeeReport,
  getEnrollmentReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/summary', getSummaryReport);
router.get('/attendance', getAttendanceReport);
router.get('/fees', getFeeReport);
router.get('/enrollment', getEnrollmentReport);

module.exports = router;
