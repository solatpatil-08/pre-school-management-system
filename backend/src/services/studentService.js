const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Setting = require('../models/Setting');
const ApiError = require('../utils/apiError');

class StudentService {
  /**
   * Get all students with pagination, search, filtering, and role-based scoping
   * @param {Object} user - The authenticated req.user
   * @param {Object} query - Express req.query parameters
   */
  async getAllStudents(user, query = {}) {
    const {
      classId,
      class: classParam,
      status,
      gender,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const filter = {};
    const andConditions = [];

    // 1. Role-Based Scoping
    if (user && user.role) {
      const role = user.role.toLowerCase();

      if (role === 'teacher') {
        const teacher = await Teacher.findOne({ user: user._id });
        if (!teacher) {
          return {
            students: [],
            total: 0,
            page: Number(page),
            currentPage: Number(page),
            pages: 0,
            totalPages: 0,
            limit: Number(limit),
          };
        }

        const assignedClasses = (teacher.assignedClasses || []).map(String);
        const leadClasses = (await Class.find({ teacher: teacher._id }).distinct('_id')).map(String);
        const teacherClassIds = [...new Set([...assignedClasses, ...leadClasses])];

        if (teacherClassIds.length === 0) {
          return {
            students: [],
            total: 0,
            page: Number(page),
            currentPage: Number(page),
            pages: 0,
            totalPages: 0,
            limit: Number(limit),
          };
        }

        // Restrict to teacher's classes
        andConditions.push({ class: { $in: teacherClassIds } });
      } else if (role === 'parent') {
        const parent = await Parent.findOne({ user: user._id });
        if (!parent) {
          return {
            students: [],
            total: 0,
            page: Number(page),
            currentPage: Number(page),
            pages: 0,
            totalPages: 0,
            limit: Number(limit),
          };
        }

        // Restrict to parent's children
        andConditions.push({
          $or: [
            { parent: parent._id },
            { _id: { $in: parent.children || [] } },
          ],
        });
      }
      // 'admin' role has full visibility - no scoping condition needed
    }

    // 2. Class Filtering
    const targetClass = classId || classParam;
    if (targetClass && targetClass !== 'all') {
      andConditions.push({ class: targetClass });
    }

    // 3. Gender Filtering
    if (gender && gender !== 'all') {
      andConditions.push({ gender: { $regex: `^${gender}$`, $options: 'i' } });
    }

    // 4. Status Filtering
    if (status && status !== 'all') {
      andConditions.push({ status: { $regex: `^${status}$`, $options: 'i' } });
    }

    // 5. Search (Student Name, Student ID, Parent Name)
    if (search && search.trim() !== '') {
      const trimmed = search.trim();
      const searchRegex = { $regex: trimmed, $options: 'i' };

      // Subquery: Find parents whose names match the search term
      const matchedParents = await Parent.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      }).select('_id');
      const parentIds = matchedParents.map((p) => p._id);

      // Support multi-word searches (e.g., "John Doe")
      const nameParts = trimmed.split(/\s+/);
      let parentIdsFromFullName = [];
      if (nameParts.length > 1) {
        const matchedParentsFullName = await Parent.find({
          $and: [
            { firstName: { $regex: nameParts[0], $options: 'i' } },
            { lastName: { $regex: nameParts.slice(1).join(' '), $options: 'i' } },
          ],
        }).select('_id');
        parentIdsFromFullName = matchedParentsFullName.map((p) => p._id);
      }

      const allMatchedParentIds = [
        ...new Set([...parentIds.map(String), ...parentIdsFromFullName.map(String)]),
      ];

      const searchOr = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { studentId: searchRegex },
      ];

      if (allMatchedParentIds.length > 0) {
        searchOr.push({ parent: { $in: allMatchedParentIds } });
      }

      if (nameParts.length > 1) {
        searchOr.push({
          $and: [
            { firstName: { $regex: nameParts[0], $options: 'i' } },
            { lastName: { $regex: nameParts.slice(1).join(' '), $options: 'i' } },
          ],
        });
      }

      andConditions.push({ $or: searchOr });
    }

    // Construct final filter query
    const finalFilter = andConditions.length > 0 ? { $and: andConditions } : filter;

    // 6. Sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection =
      sortOrder === 'asc' || sortOrder === '1' || sortOrder === 1 ? 1 : -1;
    const sortOption = { [sortField]: sortDirection };

    // 7. Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // 8. Execute Database Query
    const [students, total] = await Promise.all([
      Student.find(finalFilter)
        .populate('class', 'name section roomNumber capacity')
        .populate('parent', 'firstName lastName phone email relationship')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Student.countDocuments(finalFilter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      students,
      total,
      currentPage: pageNum,
      page: pageNum,
      totalPages,
      pages: totalPages,
      limit: limitNum,
    };
  }

  /**
   * Get student details by ID with role-based permission verification
   * @param {string} id - Student document ID
   * @param {Object} user - The authenticated req.user
   */
  async getStudentById(id, user) {
    const student = await Student.findById(id)
      .populate('class')
      .populate('parent');

    if (!student) {
      throw ApiError.notFound(`Student with ID ${id} not found`);
    }

    // Role-based access verification
    if (user && user.role) {
      const role = user.role.toLowerCase();

      if (role === 'teacher') {
        const teacher = await Teacher.findOne({ user: user._id });
        if (!teacher) {
          throw ApiError.forbidden('You are not authorized to view this student');
        }
        const leadClasses = (await Class.find({ teacher: teacher._id }).distinct('_id')).map(String);
        const assignedClasses = [
          ...(teacher.assignedClasses || []).map(String),
          ...leadClasses,
        ];
        const studentClassId = student.class?._id
          ? String(student.class._id)
          : String(student.class);

        if (!assignedClasses.includes(studentClassId)) {
          throw ApiError.forbidden('You are not assigned to this student\'s class');
        }
      } else if (role === 'parent') {
        const parent = await Parent.findOne({ user: user._id });
        if (!parent) {
          throw ApiError.forbidden('You are not authorized to view this student');
        }

        const isLinkedParent =
          student.parent &&
          String(student.parent._id || student.parent) === String(parent._id);
        const isChildInList = (parent.children || []).some(
          (cId) => String(cId) === String(student._id)
        );

        if (!isLinkedParent && !isChildInList) {
          throw ApiError.forbidden('You can only view records for your own child');
        }
      }
    }

    return student;
  }

  /**
   * Register a new student (Admin only)
   * @param {Object} studentData
   */
  async createStudent(studentData) {
    // 1. Verify class exists
    const classExists = await Class.findById(studentData.class);
    if (!classExists) {
      throw ApiError.badRequest('Assigned class does not exist');
    }

    // 2. Generate or verify unique studentId
    if (!studentData.studentId || studentData.studentId.trim() === '') {
      const setting = await Setting.findOne();
      const prefix = setting?.admissionPrefix || 'SKA-';
      const year = new Date().getFullYear();
      const count = await Student.countDocuments();
      const seq = String(count + 1).padStart(3, '0');
      studentData.studentId = `${prefix}${year}-${seq}`;
    } else {
      const existingId = await Student.findOne({ studentId: studentData.studentId });
      if (existingId) {
        throw ApiError.conflict(`Student ID '${studentData.studentId}' already exists`);
      }
    }

    // 3. Create student
    const student = await Student.create(studentData);

    // 4. If parent provided, link to parent's children array
    if (studentData.parent) {
      await Parent.findByIdAndUpdate(studentData.parent, {
        $addToSet: { children: student._id },
      });
    }

    return await student.populate(['class', 'parent']);
  }

  /**
   * Update student details (Admin only)
   * @param {string} id
   * @param {Object} updateData
   */
  async updateStudent(id, updateData) {
    const student = await Student.findById(id);
    if (!student) {
      throw ApiError.notFound(`Student with ID ${id} not found`);
    }

    // Check class existence if changed
    if (updateData.class && String(updateData.class) !== String(student.class)) {
      const classExists = await Class.findById(updateData.class);
      if (!classExists) {
        throw ApiError.badRequest('Assigned class does not exist');
      }
    }

    // Check studentId uniqueness if changed
    if (updateData.studentId && updateData.studentId !== student.studentId) {
      const existing = await Student.findOne({ studentId: updateData.studentId });
      if (existing) {
        throw ApiError.conflict(`Student ID '${updateData.studentId}' already in use`);
      }
    }

    // Handle parent relationship changes
    if (
      updateData.parent !== undefined &&
      String(updateData.parent || '') !== String(student.parent || '')
    ) {
      if (student.parent) {
        await Parent.findByIdAndUpdate(student.parent, {
          $pull: { children: student._id },
        });
      }
      if (updateData.parent) {
        await Parent.findByIdAndUpdate(updateData.parent, {
          $addToSet: { children: student._id },
        });
      }
    }

    Object.assign(student, updateData);
    await student.save();

    return await student.populate(['class', 'parent']);
  }

  /**
   * Delete student (Admin only)
   * @param {string} id
   */
  async deleteStudent(id) {
    const student = await Student.findById(id);
    if (!student) {
      throw ApiError.notFound(`Student with ID ${id} not found`);
    }

    // Remove from linked parent
    if (student.parent) {
      await Parent.findByIdAndUpdate(student.parent, {
        $pull: { children: student._id },
      });
    }

    await Student.findByIdAndDelete(id);
    return { message: 'Student removed successfully' };
  }

  /**
   * Get students belonging to a specific class
   * @param {string} classId
   * @param {Object} user
   */
  async getStudentsByClass(classId, user) {
    const classExists = await Class.findById(classId);
    if (!classExists) {
      throw ApiError.notFound('Class not found');
    }

    if (user && user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: user._id });
      if (!teacher) {
        throw ApiError.forbidden('You are not authorized to view students of this class');
      }
      const leadClasses = (await Class.find({ teacher: teacher._id }).distinct('_id')).map(String);
      const assigned = [
        ...(teacher.assignedClasses || []).map(String),
        ...leadClasses,
      ];
      if (!assigned.includes(String(classId))) {
        throw ApiError.forbidden('You are not assigned to this class');
      }
    }

    const students = await Student.find({ class: classId })
      .populate('parent', 'firstName lastName phone email relationship')
      .sort({ firstName: 1, lastName: 1 });

    return students;
  }
}

module.exports = new StudentService();
