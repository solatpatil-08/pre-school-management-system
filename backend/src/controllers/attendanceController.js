const attendanceService = require('../services/attendanceService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get attendance records with statistics
 * @route   GET /api/attendance
 * @access  Private (Admin, Teacher, Parent)
 */
const getAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendance(req.user, req.query);

  return ApiResponse.success(res, {
    message: 'Attendance records retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Mark individual student attendance
 * @route   POST /api/attendance
 * @access  Private (Admin, Teacher)
 */
const markAttendance = asyncHandler(async (req, res) => {
  const record = await attendanceService.markSingleAttendance(req.body, req.user, req.query);

  return ApiResponse.success(res, {
    message: 'Attendance recorded successfully',
    data: { attendance: record },
  });
});

/**
 * @desc    Bulk mark class attendance
 * @route   POST /api/attendance/bulk
 * @access  Private (Admin, Teacher)
 */
const markBulkAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.markBulkAttendance(req.body, req.user);

  return ApiResponse.success(res, {
    message: result.message,
    data: result,
  });
});

/**
 * @desc    Get attendance history for a single student
 * @route   GET /api/attendance/student/:studentId
 * @access  Private (Admin, Teacher, Parent)
 */
const getStudentAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getStudentAttendance(
    req.params.studentId,
    req.user,
    req.query
  );

  return ApiResponse.success(res, {
    message: 'Student attendance history retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Update attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private (Admin, Teacher)
 */
const updateAttendance = asyncHandler(async (req, res) => {
  const record = await attendanceService.updateAttendance(
    req.params.id,
    req.body,
    req.user
  );

  return ApiResponse.success(res, {
    message: 'Attendance record updated successfully',
    data: { attendance: record },
  });
});

module.exports = {
  getAttendance,
  markAttendance,
  markBulkAttendance,
  getStudentAttendance,
  updateAttendance,
};
