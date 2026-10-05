const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Schedule = require('../models/Schedule');
const ApiError = require('../utils/apiError');

class ClassService {
  /**
   * Normalize input fields to support both spec field names and legacy aliases
   */
  _normalizeData(data) {
    const normalized = { ...data };

    if (normalized.className && !normalized.name) {
      normalized.name = normalized.className;
    } else if (normalized.name && !normalized.className) {
      normalized.className = normalized.name;
    }

    if (normalized.room && !normalized.roomNumber) {
      normalized.roomNumber = normalized.room;
    } else if (normalized.roomNumber && !normalized.room) {
      normalized.room = normalized.roomNumber;
    }

    if (normalized.classTeacher && !normalized.teacher) {
      normalized.teacher = normalized.classTeacher;
    } else if (normalized.teacher && !normalized.classTeacher) {
      normalized.classTeacher = normalized.teacher;
    }

    return normalized;
  }

  /**
   * Format class object to guarantee presence of all standard fields
   */
  _formatClassObject(clsDoc, students = null, studentCount = 0) {
    const obj = clsDoc.toObject ? clsDoc.toObject() : { ...clsDoc };

    obj.className = obj.className || obj.name;
    obj.name = obj.name || obj.className;
    obj.room = obj.room || obj.roomNumber;
    obj.roomNumber = obj.roomNumber || obj.room;
    obj.classTeacher = obj.classTeacher || obj.teacher;
    obj.teacher = obj.teacher || obj.classTeacher;
    obj.studentCount = studentCount;

    if (students !== null) {
      obj.students = students;
    }

    return obj;
  }

  /**
   * Get all classes with search, filters, and enrolled student counts
   */
  async getAllClasses(query = {}) {
    const { status, academicYear, section, teacherId, search } = query;
    const filter = {};

    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    if (section) filter.section = section;
    if (teacherId) {
      filter.$or = [{ teacher: teacherId }, { classTeacher: teacherId }];
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { name: searchRegex },
        { className: searchRegex },
        { roomNumber: searchRegex },
        { room: searchRegex },
        { section: searchRegex },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const classes = await Class.find(filter)
      .populate('teacher', 'firstName lastName email phone employeeId teacherId')
      .populate('classTeacher', 'firstName lastName email phone employeeId teacherId')
      .sort({ name: 1, section: 1 });

    // Compute live enrolled student counts
    const enhancedClasses = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({ class: cls._id, status: 'Active' });
        return this._formatClassObject(cls, null, studentCount);
      })
    );

    return enhancedClasses;
  }

  /**
   * Get single class by ID with enrolled students
   */
  async getClassById(id) {
    const cls = await Class.findById(id)
      .populate('teacher', 'firstName lastName email phone employeeId teacherId qualification')
      .populate('classTeacher', 'firstName lastName email phone employeeId teacherId qualification');

    if (!cls) {
      throw ApiError.notFound(`Class with ID ${id} not found`);
    }

    const students = await Student.find({ class: id, status: 'Active' })
      .select('firstName lastName studentId gender profilePhoto admissionDate parent dateOfBirth')
      .populate('parent', 'firstName lastName phone email');

    return this._formatClassObject(cls, students, students.length);
  }

  /**
   * Create new class with duplicate check
   */
  async createClass(classData) {
    const normalized = this._normalizeData(classData);

    const targetName = (normalized.className || normalized.name || '').trim();
    const targetSection = (normalized.section || 'A').trim();
    const targetYear = (normalized.academicYear || '2026-2027').trim();

    const existing = await Class.findOne({
      $or: [
        { name: targetName, section: targetSection, academicYear: targetYear },
        { className: targetName, section: targetSection, academicYear: targetYear },
      ],
    });

    if (existing) {
      throw ApiError.conflict(
        `Class "${targetName}" (Section ${targetSection}) for academic year ${targetYear} already exists`
      );
    }

    normalized.name = targetName;
    normalized.className = targetName;
    normalized.section = targetSection;
    normalized.academicYear = targetYear;
    normalized.roomNumber = normalized.roomNumber || normalized.room;
    normalized.room = normalized.room || normalized.roomNumber;
    normalized.teacher = normalized.teacher || normalized.classTeacher;
    normalized.classTeacher = normalized.classTeacher || normalized.teacher;

    const newClass = await Class.create(normalized);

    // Link class to teacher if assigned
    const assignedTeacherId = newClass.classTeacher || newClass.teacher;
    if (assignedTeacherId) {
      await Teacher.findByIdAndUpdate(assignedTeacherId, {
        $addToSet: { assignedClasses: newClass._id },
      });
    }

    const populated = await Class.findById(newClass._id)
      .populate('teacher', 'firstName lastName email phone employeeId teacherId')
      .populate('classTeacher', 'firstName lastName email phone employeeId teacherId');

    return this._formatClassObject(populated, [], 0);
  }

  /**
   * Update class details
   */
  async updateClass(id, updateData) {
    const cls = await Class.findById(id);
    if (!cls) {
      throw ApiError.notFound(`Class with ID ${id} not found`);
    }

    const normalized = this._normalizeData(updateData);

    const checkName = (normalized.name || cls.name).trim();
    const checkSection = (normalized.section || cls.section).trim();
    const checkYear = (normalized.academicYear || cls.academicYear).trim();

    // Check duplicate if name/section/year changed
    if (
      checkName !== cls.name ||
      checkSection !== cls.section ||
      checkYear !== cls.academicYear
    ) {
      const duplicate = await Class.findOne({
        _id: { $ne: id },
        $or: [
          { name: checkName, section: checkSection, academicYear: checkYear },
          { className: checkName, section: checkSection, academicYear: checkYear },
        ],
      });
      if (duplicate) {
        throw ApiError.conflict('Another class with this name, section, and academic year already exists');
      }
    }

    // Handle teacher reassignment
    const oldTeacher = cls.classTeacher || cls.teacher;
    const newTeacher = normalized.classTeacher || normalized.teacher;

    if (newTeacher !== undefined && String(newTeacher) !== String(oldTeacher)) {
      if (oldTeacher) {
        await Teacher.findByIdAndUpdate(oldTeacher, {
          $pull: { assignedClasses: cls._id },
        });
      }
      if (newTeacher) {
        await Teacher.findByIdAndUpdate(newTeacher, {
          $addToSet: { assignedClasses: cls._id },
        });
      }
    }

    Object.assign(cls, normalized);
    await cls.save();

    const updated = await Class.findById(id)
      .populate('teacher', 'firstName lastName email phone employeeId teacherId')
      .populate('classTeacher', 'firstName lastName email phone employeeId teacherId');

    const studentCount = await Student.countDocuments({ class: id, status: 'Active' });
    return this._formatClassObject(updated, null, studentCount);
  }

  /**
   * Delete class with integrity guards
   */
  async deleteClass(id) {
    const cls = await Class.findById(id);
    if (!cls) {
      throw ApiError.notFound(`Class with ID ${id} not found`);
    }

    const studentCount = await Student.countDocuments({ class: id });
    if (studentCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete class: ${studentCount} students are currently enrolled in this class. Please reassign them first.`
      );
    }

    const assignedTeacher = cls.classTeacher || cls.teacher;
    if (assignedTeacher) {
      await Teacher.findByIdAndUpdate(assignedTeacher, {
        $pull: { assignedClasses: id },
      });
    }

    // Clean up schedule entries for this class
    await Schedule.deleteMany({ class: id });

    await Class.findByIdAndDelete(id);
    return { message: 'Class deleted successfully' };
  }
}

module.exports = new ClassService();
