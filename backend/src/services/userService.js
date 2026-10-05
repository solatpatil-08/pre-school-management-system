const User = require('../models/User');
const ApiError = require('../utils/apiError');

class UserService {
  async getAllUsers(query = {}) {
    const { role, isActive, search } = query;
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return users;
  }

  async getUserById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }
    return user;
  }

  async createUser(userData) {
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict(`An account with email '${userData.email}' already exists`);
    }

    const user = await User.create({
      ...userData,
      email: userData.email.toLowerCase(),
    });

    return user.toJSON();
  }

  async updateUser(id, updateData) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }

    if (updateData.email && updateData.email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: updateData.email.toLowerCase() });
      if (existing) {
        throw ApiError.conflict(`Email '${updateData.email}' is already in use`);
      }
      user.email = updateData.email.toLowerCase();
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.role) user.role = updateData.role;
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    if (updateData.isActive !== undefined) user.isActive = updateData.isActive;
    if (updateData.avatar !== undefined) user.avatar = updateData.avatar;

    // Optional password reset by admin
    if (updateData.password && updateData.password.trim().length >= 6) {
      user.password = updateData.password;
    }

    await user.save();
    return user.toJSON();
  }

  async deleteUser(id, currentUserId) {
    if (String(id) === String(currentUserId)) {
      throw ApiError.badRequest('You cannot delete your own active administrator account');
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }

    await User.findByIdAndDelete(id);
    return { message: 'User account removed successfully' };
  }
}

module.exports = new UserService();
