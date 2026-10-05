const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return ApiResponse.created(res, {
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  return ApiResponse.success(res, {
    message: 'User authenticated successfully',
    data: result,
  });
});

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);

  return ApiResponse.success(res, {
    message: 'Profile retrieved successfully',
    data: { user },
  });
});

/**
 * @desc    Update user profile (name, phone, avatar)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user._id, req.body);

  return ApiResponse.success(res, {
    message: 'Profile updated successfully',
    data: { user: updatedUser },
  });
});

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
