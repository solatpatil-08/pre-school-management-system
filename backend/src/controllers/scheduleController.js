const scheduleService = require('../services/scheduleService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all timetable schedules
 * @route   GET /api/schedules
 * @access  Private (Admin, Teacher, Parent)
 */
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await scheduleService.getAllSchedules(req.user, req.query);

  return ApiResponse.success(res, {
    message: 'Timetable schedules retrieved successfully',
    data: { schedules },
  });
});

/**
 * @desc    Get single schedule slot by ID
 * @route   GET /api/schedules/:id
 * @access  Private (Admin, Teacher, Parent)
 */
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.getScheduleById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Schedule slot retrieved successfully',
    data: { schedule },
  });
});

/**
 * @desc    Get schedule by class ID
 * @route   GET /api/schedules/class/:classId
 * @access  Private (Admin, Teacher, Parent)
 */
const getSchedulesByClass = asyncHandler(async (req, res) => {
  const schedules = await scheduleService.getSchedulesByClass(
    req.params.classId,
    req.query.dayOfWeek || req.query.day,
    req.user
  );

  return ApiResponse.success(res, {
    message: 'Class timetable retrieved successfully',
    data: { schedules },
  });
});

/**
 * @desc    Create new schedule timetable slot
 * @route   POST /api/schedules
 * @access  Private (Admin)
 */
const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body);

  return ApiResponse.created(res, {
    message: 'Schedule slot created successfully',
    data: { schedule },
  });
});

/**
 * @desc    Update schedule slot
 * @route   PUT /api/schedules/:id
 * @access  Private (Admin)
 */
const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.updateSchedule(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'Schedule slot updated successfully',
    data: { schedule },
  });
});

/**
 * @desc    Delete schedule slot
 * @route   DELETE /api/schedules/:id
 * @access  Private (Admin)
 */
const deleteSchedule = asyncHandler(async (req, res) => {
  const result = await scheduleService.deleteSchedule(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  getSchedules,
  getScheduleById,
  getSchedulesByClass,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
