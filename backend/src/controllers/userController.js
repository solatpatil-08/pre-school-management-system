const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all users (excluding passwords)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers(req.query);

  return ApiResponse.success(res, {
    message: 'User directory retrieved successfully',
    data: { users },
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return ApiResponse.success(res, {
    message: 'User details retrieved successfully',
    data: { user },
  });
});

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (Admin)
 */
const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);

  return ApiResponse.created(res, {
    message: 'User account provisioned successfully',
    data: { user },
  });
});

/**
 * @desc    Update user account
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'User account updated successfully',
    data: { user },
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.user._id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
