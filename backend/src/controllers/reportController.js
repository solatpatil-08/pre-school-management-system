const reportService = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get executive school summary report
 * @route   GET /api/reports/summary
 * @access  Private (Admin)
 */
const getSummaryReport = asyncHandler(async (req, res) => {
  const result = await reportService.getSummaryReport();

  return ApiResponse.success(res, {
    message: 'Summary analytics report retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Get attendance trends and history report
 * @route   GET /api/reports/attendance
 * @access  Private (Admin)
 */
const getAttendanceReport = asyncHandler(async (req, res) => {
  const result = await reportService.getAttendanceReport(req.query);

  return ApiResponse.success(res, {
    message: 'Attendance trends report retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Get financial revenue & fee collection report
 * @route   GET /api/reports/fees
 * @access  Private (Admin)
 */
const getFeeReport = asyncHandler(async (req, res) => {
  const result = await reportService.getFeeReport(req.query);

  return ApiResponse.success(res, {
    message: 'Financial revenue report retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Get student enrollment and class capacity report
 * @route   GET /api/reports/enrollment
 * @access  Private (Admin)
 */
const getEnrollmentReport = asyncHandler(async (req, res) => {
  const result = await reportService.getEnrollmentReport();

  return ApiResponse.success(res, {
    message: 'Enrollment capacity report retrieved successfully',
    data: result,
  });
});

module.exports = {
  getSummaryReport,
  getAttendanceReport,
  getFeeReport,
  getEnrollmentReport,
};
