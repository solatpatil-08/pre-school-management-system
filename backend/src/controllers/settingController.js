const settingService = require('../services/settingService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get school settings
 * @route   GET /api/settings
 * @access  Private (All Authenticated)
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings();

  return ApiResponse.success(res, {
    message: 'School settings retrieved successfully',
    data: { settings },
  });
});

/**
 * @desc    Update school settings
 * @route   PUT /api/settings
 * @access  Private (Admin)
 */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(req.body);

  return ApiResponse.success(res, {
    message: 'School settings updated successfully',
    data: { settings },
  });
});

module.exports = {
  getSettings,
  updateSettings,
};
