const teacherService = require('../services/teacherService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all teachers with query filters, search, and pagination
 * @route   GET /api/teachers
 * @access  Private (Admin, Teacher)
 */
const getTeachers = asyncHandler(async (req, res) => {
  const result = await teacherService.getAllTeachers(req.user, req.query);

  return ApiResponse.success(res, {
    message: 'Teachers retrieved successfully',
    data: {
      ...result,
      data: result.teachers,
    },
  });
});

/**
 * @desc    Get single teacher by ID or 'me'
 * @route   GET /api/teachers/:id
 * @access  Private (Admin, Teacher)
 */
const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Teacher profile retrieved successfully',
    data: {
      teacher,
      data: teacher,
    },
  });
});

/**
 * @desc    Create new teacher
 * @route   POST /api/teachers
 * @access  Private (Admin)
 */
const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(req.body);

  return ApiResponse.created(res, {
    message: 'Teacher registered successfully',
    data: {
      teacher,
      data: teacher,
    },
  });
});

/**
 * @desc    Update teacher profile
 * @route   PUT /api/teachers/:id
 * @access  Private (Admin)
 */
const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacher(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'Teacher profile updated successfully',
    data: {
      teacher,
      data: teacher,
    },
  });
});

/**
 * @desc    Delete teacher
 * @route   DELETE /api/teachers/:id
 * @access  Private (Admin)
 */
const deleteTeacher = asyncHandler(async (req, res) => {
  const result = await teacherService.deleteTeacher(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
