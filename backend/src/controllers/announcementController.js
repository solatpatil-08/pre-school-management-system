const announcementService = require('../services/announcementService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all announcements
 * @route   GET /api/announcements
 * @access  Private (All Authenticated)
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await announcementService.getAllAnnouncements(req.user, req.query);

  return ApiResponse.success(res, {
    message: 'Announcements retrieved successfully',
    data: {
      announcements,
      data: announcements,
    },
  });
});

/**
 * @desc    Get single announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Private (All Authenticated)
 */
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncementById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Announcement retrieved successfully',
    data: {
      announcement,
      data: announcement,
    },
  });
});

/**
 * @desc    Create new announcement
 * @route   POST /api/announcements
 * @access  Private (Admin)
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(req.body, req.user);

  return ApiResponse.created(res, {
    message: 'Announcement created successfully',
    data: {
      announcement,
      data: announcement,
    },
  });
});

/**
 * @desc    Update announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin)
 */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'Announcement updated successfully',
    data: {
      announcement,
      data: announcement,
    },
  });
});

/**
 * @desc    Publish a draft announcement
 * @route   PATCH /api/announcements/:id/publish
 * @access  Private (Admin)
 */
const publishAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.publishAnnouncement(req.params.id);

  return ApiResponse.success(res, {
    message: 'Announcement published successfully',
    data: {
      announcement,
      data: announcement,
    },
  });
});

/**
 * @desc    Delete announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin)
 */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await announcementService.deleteAnnouncement(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
};
