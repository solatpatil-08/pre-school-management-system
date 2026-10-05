const Parent = require('../models/Parent');
const User = require('../models/User');
const Student = require('../models/Student');
const ApiError = require('../utils/apiError');
const { splitFullName, parsePagination } = require('../utils/commonUtil');

class ParentService {
  async getAllParents(query = {}) {
    const { search } = query;
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const { page: pageNum, limit: limitNum, skip, calculateTotalPages } = parsePagination(query, 100, 100);

    const [parents, total] = await Promise.all([
      Parent.find(filter)
        .populate({
          path: 'children',
          select: 'firstName lastName studentId class profilePhoto',
          populate: { path: 'class', select: 'name section' },
        })
        .populate('user', 'name email role isActive avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Parent.countDocuments(filter),
    ]);

    return {
      parents,
      total,
      page: pageNum,
      pages: calculateTotalPages(total),
    };
  }

  async getParentById(id, user = null) {
    const parent = await Parent.findById(id)
      .populate({
        path: 'children',
        populate: { path: 'class', select: 'name section roomNumber' },
      })
      .populate('user', 'name email role isActive avatar');

    if (!parent) {
      throw ApiError.notFound(`Parent with ID ${id} not found`);
    }

    // IDOR Protection: Parent can only access their own parent profile
    if (user && user.role && user.role.toLowerCase() === 'parent') {
      const parentUserId = parent.user?._id ? String(parent.user._id) : String(parent.user);
      if (parentUserId !== String(user._id)) {
        throw ApiError.forbidden('You are only authorized to view your own parent profile');
      }
    }

    return parent;
  }

  async getParentByUserId(userId) {
    const parent = await Parent.findOne({ user: userId })
      .populate({
        path: 'children',
        populate: { path: 'class', select: 'name section roomNumber teacher' },
      })
      .populate('user', 'name email role isActive avatar');

    if (!parent) {
      throw ApiError.notFound('Parent profile associated with current account not found');
    }

    return parent;
  }

  async createParent(parentData) {
    if (!parentData.firstName && parentData.name) {
      const { firstName, lastName } = splitFullName(parentData.name, 'Parent', 'User');
      parentData.firstName = firstName;
      parentData.lastName = lastName;
    }

    // 1. Create or link user account
    if (!parentData.user) {
      let user = await User.findOne({ email: parentData.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: `${parentData.firstName} ${parentData.lastName}`,
          email: parentData.email.toLowerCase(),
          password: parentData.password || 'parent123',
          role: 'parent',
          phone: parentData.phone || '',
        });
      }
      parentData.user = user._id;
    }

    // 2. Create parent
    const parent = await Parent.create(parentData);

    // 3. Link students
    if (parentData.children && parentData.children.length > 0) {
      await Student.updateMany(
        { _id: { $in: parentData.children } },
        { $set: { parent: parent._id } }
      );
    }

    return await parent.populate(['children', { path: 'user', select: '-password' }]);
  }

  async updateParent(id, updateData, user = null) {
    const parent = await Parent.findById(id);
    if (!parent) {
      throw ApiError.notFound(`Parent with ID ${id} not found`);
    }

    // IDOR & Privilege Escalation Protection:
    // If authenticated as a parent, ensure they own this profile and cannot alter student linkages or system fields
    if (user && user.role && user.role.toLowerCase() === 'parent') {
      const parentUserId = parent.user?._id ? String(parent.user._id) : String(parent.user);
      if (parentUserId !== String(user._id)) {
        throw ApiError.forbidden('You are only authorized to update your own parent profile');
      }
      delete updateData.children;
      delete updateData.user;
      delete updateData.role;
    }

    Object.assign(parent, updateData);
    await parent.save();

    // Sync student links
    if (updateData.children) {
      await Student.updateMany(
        { _id: { $in: updateData.children } },
        { $set: { parent: parent._id } }
      );
    }

    // Sync user email/name if updated
    if (updateData.firstName || updateData.lastName || updateData.email) {
      await User.findByIdAndUpdate(parent.user, {
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email,
      });
    }

    return await parent.populate(['children', { path: 'user', select: '-password' }]);
  }

  async deleteParent(id) {
    const parent = await Parent.findById(id);
    if (!parent) {
      throw ApiError.notFound(`Parent with ID ${id} not found`);
    }

    // Unlink children
    await Student.updateMany({ parent: id }, { $set: { parent: null } });

    await Parent.findByIdAndDelete(id);
    return { message: 'Parent profile removed successfully' };
  }
}

module.exports = new ParentService();
