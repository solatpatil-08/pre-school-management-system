const Announcement = require('../models/Announcement');
const ApiError = require('../utils/apiError');

class AnnouncementService {
  /**
   * Get all announcements with role-based visibility and filters
   */
  async getAllAnnouncements(user, query = {}) {
    const { targetRole, priority, status, search } = query;
    const filter = {};

    // Role-based visibility:
    // Teachers and Parents can ONLY see 'Published' announcements targeted to them or 'All'
    if (user && user.role !== 'admin') {
      filter.status = 'Published';

      const allowedRoles = ['All'];
      if (user.role === 'teacher') allowedRoles.push('Teacher');
      if (user.role === 'parent') allowedRoles.push('Parent');
      filter.targetRole = { $in: allowedRoles };
    } else {
      // Admin can filter by status and targetRole
      if (status) {
        filter.status = status;
      }
      if (targetRole && targetRole !== 'ALL') {
        filter.targetRole = targetRole;
      }
    }

    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { message: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 });

    return announcements;
  }

  /**
   * Get single announcement by ID with role check
   */
  async getAnnouncementById(id, user = null) {
    const announcement = await Announcement.findById(id).populate('createdBy', 'name email role');
    if (!announcement) {
      throw ApiError.notFound(`Announcement with ID ${id} not found`);
    }

    // Role-based visibility check for non-admin
    if (user && user.role !== 'admin') {
      if (announcement.status !== 'Published') {
        throw ApiError.notFound('Announcement not found or not published');
      }
      const allowedRoles = ['All', user.role === 'teacher' ? 'Teacher' : 'Parent'];
      if (!allowedRoles.includes(announcement.targetRole)) {
        throw ApiError.forbidden('You do not have access to view this announcement');
      }
    }

    return announcement;
  }

  /**
   * Create new announcement
   */
  async createAnnouncement(data, user) {
    const status = data.status || 'Published';
    const publishedAt = status === 'Published' ? data.publishedAt || new Date() : null;

    const announcement = await Announcement.create({
      ...data,
      status,
      publishedAt,
      createdBy: user._id,
    });

    return await announcement.populate('createdBy', 'name email role');
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(id, updateData) {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw ApiError.notFound(`Announcement with ID ${id} not found`);
    }

    // If changing to Published from Draft, set publishedAt
    if (updateData.status === 'Published' && !announcement.publishedAt) {
      updateData.publishedAt = new Date();
    }

    Object.assign(announcement, updateData);
    await announcement.save();

    return await announcement.populate('createdBy', 'name email role');
  }

  /**
   * Publish a draft announcement
   */
  async publishAnnouncement(id) {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw ApiError.notFound(`Announcement with ID ${id} not found`);
    }

    announcement.status = 'Published';
    announcement.publishedAt = new Date();
    await announcement.save();

    return await announcement.populate('createdBy', 'name email role');
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id) {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw ApiError.notFound(`Announcement with ID ${id} not found`);
    }

    await Announcement.findByIdAndDelete(id);
    return { message: 'Announcement deleted successfully' };
  }
}

module.exports = new AnnouncementService();
