const User = require('../models/User');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const ApiError = require('../utils/apiError');
const { generateToken } = require('../utils/tokenUtil');
const { splitFullName } = require('../utils/commonUtil');

class AuthService {
  async register(userData) {
    const { name, email, password, role = 'parent', phone, avatar } = userData;

    if (!email || !password || !name) {
      throw ApiError.badRequest('Please provide name, email, and password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw ApiError.conflict(`An account with email '${normalizedEmail}' already exists`);
    }

    const normalizedRole = (role || 'parent').toLowerCase().trim();
    if (normalizedRole === 'admin' || normalizedRole === 'teacher') {
      throw ApiError.forbidden(
        'Public registration for administrative or educator accounts is restricted. Please contact the administrator.'
      );
    }
    if (normalizedRole !== 'parent') {
      throw ApiError.badRequest('Invalid role. Public registration only allows parent accounts');
    }

    // Create user - User pre-save hook securely hashes password with bcrypt
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      phone: phone || '',
      avatar: avatar || '',
      isActive: true,
      lastLogin: new Date(),
    });

    // Auto-provision corresponding profile
    if (normalizedRole === 'parent') {
      const { firstName, lastName } = splitFullName(name, 'Parent', 'User');
      const existingParent = await Parent.findOne({ user: user._id });
      if (!existingParent) {
        await Parent.create({
          user: user._id,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || '',
          relationship: 'Parent',
          children: [],
        });
      }
    } else if (normalizedRole === 'teacher') {
      const { firstName, lastName } = splitFullName(name, 'Teacher', 'User');
      const count = await Teacher.countDocuments();
      const employeeId = `TCH-${1000 + count + 1}`;
      const existingTeacher = await Teacher.findOne({ user: user._id });
      if (!existingTeacher) {
        await Teacher.create({
          user: user._id,
          employeeId,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || '',
          assignedClasses: [],
        });
      }
    }

    const token = generateToken(user._id, user.role);
    const userSafe = user.toJSON();

    return {
      token,
      user: userSafe,
    };
  }
  async login(email, password) {
    if (!email || !password) {
      throw ApiError.badRequest('Please provide both email and password');
    }

    // Find user and explicitly select password for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact the administrator.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    // Ensure password is not present in returned object
    const userSafe = user.toJSON();

    return {
      token,
      user: userSafe,
    };
  }

  async getMe(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(userId, { name, phone, avatar }) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return user.toJSON();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password provided is incorrect');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters long');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();
