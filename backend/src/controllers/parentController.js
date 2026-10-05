const parentService = require('../services/parentService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all parents
 * @route   GET /api/parents
 * @access  Private (Admin)
 */
const getParents = asyncHandler(async (req, res) => {
  const result = await parentService.getAllParents(req.query);

  return ApiResponse.success(res, {
    message: 'Parents retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Get single parent by ID
 * @route   GET /api/parents/:id
 * @access  Private (Admin, Parent)
 */
const getParentById = asyncHandler(async (req, res) => {
  const parent = await parentService.getParentById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Parent record retrieved successfully',
    data: { parent },
  });
});

/**
 * @desc    Create new parent
 * @route   POST /api/parents
 * @access  Private (Admin)
 */
const createParent = asyncHandler(async (req, res) => {
  const parent = await parentService.createParent(req.body);

  return ApiResponse.created(res, {
    message: 'Parent registered successfully',
    data: { parent },
  });
});

/**
 * @desc    Update parent details
 * @route   PUT /api/parents/:id
 * @access  Private (Admin, Parent)
 */
const updateParent = asyncHandler(async (req, res) => {
  const parent = await parentService.updateParent(req.params.id, req.body, req.user);

  return ApiResponse.success(res, {
    message: 'Parent record updated successfully',
    data: { parent },
  });
});

/**
 * @desc    Delete parent
 * @route   DELETE /api/parents/:id
 * @access  Private (Admin)
 */
const deleteParent = asyncHandler(async (req, res) => {
  const result = await parentService.deleteParent(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  getParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
};
