const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAdminCharts,
  getTeacherDashboard,
  getParentDashboard,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/admin/charts', authorize('admin'), getAdminCharts);
router.get('/teacher', authorize('teacher'), getTeacherDashboard);
router.get('/parent', authorize('parent'), getParentDashboard);

module.exports = router;
