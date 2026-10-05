const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Class = require('../models/Class');
const ApiError = require('../utils/apiError');
const { splitFullName } = require('../utils/commonUtil');

class TeacherService {
  /**
   * Get all teachers with pagination, search, filtering, and role scoping
   * @param {Object} user - The authenticated req.user
   * @param {Object} query - Express req.query parameters
   */
  async getAllTeachers(user, query = {}) {
    const {
      search,
      status,
      gender,
      designation,
      classId,
      class: classParam,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const andConditions = [];

    // 1. Role-Based Scoping
    if (user && user.role && user.role.toLowerCase() === 'teacher') {
      // Teacher sees only their own educator profile
      andConditions.push({ user: user._id });
    }

    // 2. Status Filtering
    if (status && status !== 'all') {
      andConditions.push({ status: { $regex: `^${status}$`, $options: 'i' } });
    }

    // 3. Gender Filtering
    if (gender && gender !== 'all') {
      andConditions.push({ gender: { $regex: `^${gender}$`, $options: 'i' } });
    }

    // 4. Designation Filtering
    if (designation && designation !== 'all') {
      andConditions.push({ designation: { $regex: `^${designation}$`, $options: 'i' } });
    }

    // 5. Assigned Class Filtering
    const targetClass = classId || classParam;
    if (targetClass && targetClass !== 'all') {
      andConditions.push({ assignedClasses: targetClass });
    }

    // 6. Search across name, teacherId, employeeId, email, phone, designation, qualification
    if (search && search.trim() !== '') {
      const trimmed = search.trim();
      const searchRegex = { $regex: trimmed, $options: 'i' };

      const orConditions = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { teacherId: searchRegex },
        { employeeId: searchRegex },
        { designation: searchRegex },
        { qualification: searchRegex },
      ];

      // Support multi-word searches (e.g., "Sarah Jenkins")
      const nameParts = trimmed.split(/\s+/);
      if (nameParts.length > 1) {
        orConditions.push({
          $and: [
            { firstName: { $regex: nameParts[0], $options: 'i' } },
            { lastName: { $regex: nameParts.slice(1).join(' '), $options: 'i' } },
          ],
        });
      }

      andConditions.push({ $or: orConditions });
    }

    const finalFilter = andConditions.length > 0 ? { $and: andConditions } : {};

    // 7. Sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection =
      sortOrder === 'asc' || sortOrder === '1' || sortOrder === 1 ? 1 : -1;
    const sortOption = { [sortField]: sortDirection };

    // 8. Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // 9. Execute query
    const [teachers, total] = await Promise.all([
      Teacher.find(finalFilter)
        .populate('assignedClasses', 'name section roomNumber capacity academicYear')
        .populate('user', 'name email role isActive avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Teacher.countDocuments(finalFilter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      teachers,
      total,
      currentPage: pageNum,
      page: pageNum,
      totalPages,
      pages: totalPages,
      limit: limitNum,
    };
  }

  /**
   * Get single teacher by ID or 'me'
   * @param {string} id - Teacher ID or 'me'
   * @param {Object} user - The authenticated req.user
   */
  async getTeacherById(id, user) {
    let teacher;

    if (id === 'me' && user) {
      teacher = await Teacher.findOne({ user: user._id })
        .populate('assignedClasses')
        .populate('user', 'name email role isActive avatar');
      if (!teacher) {
        throw ApiError.notFound('Teacher profile associated with your account was not found');
      }
      return teacher;
    }

    teacher = await Teacher.findById(id)
      .populate('assignedClasses')
      .populate('user', 'name email role isActive avatar');

    if (!teacher) {
      throw ApiError.notFound(`Teacher with ID ${id} not found`);
    }

    // Role verification: Teacher can only view their own profile
    if (user && user.role && user.role.toLowerCase() === 'teacher') {
      const teacherUserId = teacher.user?._id ? String(teacher.user._id) : String(teacher.user);
      const isOwner = teacherUserId === String(user._id);
      if (!isOwner) {
        throw ApiError.forbidden('You are only authorized to view your own teacher profile');
      }
    }

    return teacher;
  }

  /**
   * Register a new teacher (Admin only)
   * @param {Object} teacherData
   */
  async createTeacher(teacherData) {
    if (!teacherData.firstName && teacherData.name) {
      const { firstName, lastName } = splitFullName(teacherData.name, 'Teacher', 'User');
      teacherData.firstName = firstName;
      teacherData.lastName = lastName;
    }

    const rawTeacherId = teacherData.teacherId || teacherData.employeeId;

    // 1. Verify or generate unique teacherId / employeeId
    if (!rawTeacherId || rawTeacherId.trim() === '') {
      const count = await Teacher.countDocuments();
      const generatedId = `TCH-${1000 + count + 1}`;
      teacherData.teacherId = generatedId;
      teacherData.employeeId = generatedId;
    } else {
      const trimmedId = rawTeacherId.trim();
      const existing = await Teacher.findOne({
        $or: [{ teacherId: trimmedId }, { employeeId: trimmedId }],
      });
      if (existing) {
        throw ApiError.conflict(`Teacher ID '${trimmedId}' is already assigned`);
      }
      teacherData.teacherId = trimmedId;
      teacherData.employeeId = trimmedId;
    }

    // 2. Link or create User account if not provided
    if (!teacherData.user) {
      let user = await User.findOne({ email: teacherData.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: `${teacherData.firstName} ${teacherData.lastName}`,
          email: teacherData.email.toLowerCase(),
          password: teacherData.password || 'Teacher@123',
          role: 'teacher',
          phone: teacherData.phone || '',
          avatar: teacherData.profilePhoto || '',
        });
      }
      teacherData.user = user._id;
    }

    // 3. Create teacher document
    const teacher = await Teacher.create(teacherData);

    // 4. Update assigned classes to reference this teacher
    if (teacherData.assignedClasses && teacherData.assignedClasses.length > 0) {
      await Class.updateMany(
        { _id: { $in: teacherData.assignedClasses } },
        { $set: { teacher: teacher._id } }
      );
    }

    return await teacher.populate([
      { path: 'assignedClasses', select: 'name section roomNumber capacity' },
      { path: 'user', select: '-password' },
    ]);
  }

  /**
   * Update teacher details (Admin only)
   * @param {string} id
   * @param {Object} updateData
   */
  async updateTeacher(id, updateData) {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      throw ApiError.notFound(`Teacher with ID ${id} not found`);
    }

    // Check teacherId uniqueness if changed
    const newId = updateData.teacherId || updateData.employeeId;
    if (newId && newId !== teacher.teacherId && newId !== teacher.employeeId) {
      const existing = await Teacher.findOne({
        $or: [{ teacherId: newId }, { employeeId: newId }],
        _id: { $ne: id },
      });
      if (existing) {
        throw ApiError.conflict(`Teacher ID '${newId}' is already in use`);
      }
      updateData.teacherId = newId;
      updateData.employeeId = newId;
    }

    // Synchronize assigned classes on Class model
    if (updateData.assignedClasses) {
      const prevClasses = (teacher.assignedClasses || []).map(String);
      const newClasses = updateData.assignedClasses.map(String);

      // Unassign removed classes
      const removed = prevClasses.filter((cId) => !newClasses.includes(cId));
      if (removed.length > 0) {
        await Class.updateMany(
          { _id: { $in: removed }, teacher: teacher._id },
          { $set: { teacher: null } }
        );
      }

      // Assign new classes
      if (newClasses.length > 0) {
        await Class.updateMany(
          { _id: { $in: newClasses } },
          { $set: { teacher: teacher._id } }
        );
      }
    }

    Object.assign(teacher, updateData);
    await teacher.save();

    // Synchronize User profile
    if (teacher.user) {
      const userUpdates = {};
      if (updateData.firstName || updateData.lastName) {
        userUpdates.name = `${teacher.firstName} ${teacher.lastName}`;
      }
      if (updateData.email) {
        userUpdates.email = teacher.email;
      }
      if (updateData.phone) {
        userUpdates.phone = teacher.phone;
      }
      if (updateData.profilePhoto) {
        userUpdates.avatar = teacher.profilePhoto;
      }
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(teacher.user, userUpdates);
      }
    }

    return await teacher.populate([
      { path: 'assignedClasses', select: 'name section roomNumber capacity' },
      { path: 'user', select: '-password' },
    ]);
  }

  /**
   * Delete teacher (Admin only)
   * @param {string} id
   */
  async deleteTeacher(id) {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      throw ApiError.notFound(`Teacher with ID ${id} not found`);
    }

    // Unassign classes
    await Class.updateMany({ teacher: id }, { $set: { teacher: null } });

    await Teacher.findByIdAndDelete(id);
    return { message: 'Teacher profile removed successfully' };
  }
}

module.exports = new TeacherService();
