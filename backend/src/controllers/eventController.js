const eventService = require('../services/eventService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all calendar events
 * @route   GET /api/events
 * @access  Private (All Authenticated)
 */
const getEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getAllEvents(req.user, req.query);

  return ApiResponse.success(res, {
    message: 'Events retrieved successfully',
    data: {
      events,
      data: events,
    },
  });
});

/**
 * @desc    Get event by ID
 * @route   GET /api/events/:id
 * @access  Private (All Authenticated)
 */
const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Event retrieved successfully',
    data: {
      event,
      data: event,
    },
  });
});

/**
 * @desc    Create new event
 * @route   POST /api/events
 * @access  Private (Admin)
 */
const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user);

  return ApiResponse.created(res, {
    message: 'Event scheduled successfully',
    data: {
      event,
      data: event,
    },
  });
});

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private (Admin)
 */
const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'Event updated successfully',
    data: {
      event,
      data: event,
    },
  });
});

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Admin)
 */
const deleteEvent = asyncHandler(async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
