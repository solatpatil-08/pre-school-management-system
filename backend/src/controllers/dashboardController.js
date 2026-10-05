const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get Admin Dashboard KPIs and summary
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getAdminDashboardStats();

  return ApiResponse.success(res, {
    message: 'Admin dashboard metrics retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Get Admin Dashboard Chart Metrics (Attendance, Enrollment, Fees)
 * @route   GET /api/dashboard/admin/charts
 * @access  Private (Admin)
 */
const getAdminCharts = asyncHandler(async (req, res) => {
  const result = await dashboardService.getAdminDashboardStats();

  return ApiResponse.success(res, {
    message: 'Admin dashboard charts retrieved successfully',
    data: result.charts,
    charts: result.charts,
  });
});

/**
 * @desc    Get Teacher Dashboard classes, schedules, and attendance
 * @route   GET /api/dashboard/teacher
 * @access  Private (Teacher)
 */
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getTeacherDashboardStats(req.user._id);

  return ApiResponse.success(res, {
    message: 'Teacher dashboard metrics retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Get Parent Dashboard children status, fees, and schedules
 * @route   GET /api/dashboard/parent
 * @access  Private (Parent)
 */
const getParentDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getParentDashboardStats(req.user._id);

  return ApiResponse.success(res, {
    message: 'Parent dashboard overview retrieved successfully',
    data: result,
  });
});

module.exports = {
  getAdminDashboard,
  getAdminCharts,
  getTeacherDashboard,
  getParentDashboard,
};
