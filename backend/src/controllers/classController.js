const classService = require('../services/classService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all classes
 * @route   GET /api/classes
 * @access  Private (Admin, Teacher)
 */
const getClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getAllClasses(req.query);

  return ApiResponse.success(res, {
    message: 'Classes retrieved successfully',
    data: { classes },
  });
});

/**
 * @desc    Get single class by ID
 * @route   GET /api/classes/:id
 * @access  Private (Admin, Teacher)
 */
const getClassById = asyncHandler(async (req, res) => {
  const classItem = await classService.getClassById(req.params.id);

  return ApiResponse.success(res, {
    message: 'Class details retrieved successfully',
    data: { class: classItem },
  });
});

/**
 * @desc    Create new class
 * @route   POST /api/classes
 * @access  Private (Admin)
 */
const createClass = asyncHandler(async (req, res) => {
  const newClass = await classService.createClass(req.body);

  return ApiResponse.created(res, {
    message: 'Class created successfully',
    data: { class: newClass },
  });
});

/**
 * @desc    Update class details
 * @route   PUT /api/classes/:id
 * @access  Private (Admin)
 */
const updateClass = asyncHandler(async (req, res) => {
  const updatedClass = await classService.updateClass(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'Class updated successfully',
    data: { class: updatedClass },
  });
});

/**
 * @desc    Delete class
 * @route   DELETE /api/classes/:id
 * @access  Private (Admin)
 */
const deleteClass = asyncHandler(async (req, res) => {
  const result = await classService.deleteClass(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
