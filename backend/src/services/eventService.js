const Event = require('../models/Event');
const ApiError = require('../utils/apiError');

class EventService {
  /**
   * Get all events with role-based visibility and filters
   */
  async getAllEvents(user, query = {}) {
    const { category, targetAudience, search, upcoming } = query;
    const filter = {};

    // Role-based visibility
    if (user && user.role !== 'admin') {
      const allowedAudiences = ['All'];
      if (user.role === 'teacher') allowedAudiences.push('Teacher');
      if (user.role === 'parent') allowedAudiences.push('Parent', 'Student');
      filter.targetAudience = { $in: allowedAudiences };
    } else if (targetAudience && targetAudience !== 'ALL') {
      filter.targetAudience = targetAudience;
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (upcoming === 'true' || upcoming === true) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      filter.date = { $gte: startOfToday };
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    return events;
  }

  /**
   * Get event by ID with role check
   */
  async getEventById(id, user = null) {
    const event = await Event.findById(id).populate('createdBy', 'name email role');
    if (!event) {
      throw ApiError.notFound(`Event with ID ${id} not found`);
    }

    // Role-based visibility check
    if (user && user.role !== 'admin') {
      const allowedAudiences = ['All'];
      if (user.role === 'teacher') allowedAudiences.push('Teacher');
      if (user.role === 'parent') allowedAudiences.push('Parent', 'Student');
      if (!allowedAudiences.includes(event.targetAudience)) {
        throw ApiError.forbidden('You do not have permission to view this event');
      }
    }

    return event;
  }

  /**
   * Create new event
   */
  async createEvent(data, user) {
    const eventDate = data.date || data.eventDate;
    if (!eventDate) {
      throw ApiError.badRequest('Event date is required');
    }

    const event = await Event.create({
      ...data,
      date: eventDate,
      createdBy: user ? user._id : null,
    });

    return await event.populate('createdBy', 'name email role');
  }

  /**
   * Update event
   */
  async updateEvent(id, updateData) {
    const event = await Event.findById(id);
    if (!event) {
      throw ApiError.notFound(`Event with ID ${id} not found`);
    }

    if (updateData.date || updateData.eventDate) {
      updateData.date = updateData.date || updateData.eventDate;
    }

    Object.assign(event, updateData);
    await event.save();

    return await event.populate('createdBy', 'name email role');
  }

  /**
   * Delete event
   */
  async deleteEvent(id) {
    const event = await Event.findById(id);
    if (!event) {
      throw ApiError.notFound(`Event with ID ${id} not found`);
    }

    await Event.findByIdAndDelete(id);
    return { message: 'School event deleted successfully' };
  }
}

module.exports = new EventService();
