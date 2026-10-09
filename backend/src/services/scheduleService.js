const Schedule = require('../models/Schedule');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const ApiError = require('../utils/apiError');

/**
 * Helper to convert "HH:MM" (24-hour or standard format) into minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Check if two time intervals [startA, endA) and [startB, endB) overlap
 */
function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

class ScheduleService {
  /**
   * Check scheduling conflicts for class, teacher, and room
   */
  async checkConflicts(candidate, excludeId = null) {
    const day = candidate.day || candidate.dayOfWeek;
    const startTime = candidate.startTime;
    const endTime = candidate.endTime;

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    if (newStart >= newEnd) {
      throw ApiError.badRequest('End time must be later than start time');
    }

    const query = {
      $or: [{ dayOfWeek: day }, { day: day }],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Retrieve all existing schedules on this day
    const existingSchedules = await Schedule.find(query)
      .populate('class', 'name className section roomNumber room')
      .populate('teacher', 'firstName lastName');

    const targetClassId = candidate.class ? String(candidate.class) : null;
    const targetTeacherId = candidate.teacher ? String(candidate.teacher) : null;
    const targetRoom = (candidate.room || candidate.classroom || '').trim().toLowerCase();

    for (const item of existingSchedules) {
      const itemStart = timeToMinutes(item.startTime);
      const itemEnd = timeToMinutes(item.endTime);

      if (intervalsOverlap(newStart, newEnd, itemStart, itemEnd)) {
        const itemActivity = item.activity || item.activityName || 'Scheduled slot';
        const itemClassId = item.class?._id ? String(item.class._id) : String(item.class);
        const itemTeacherId = item.teacher?._id ? String(item.teacher._id) : item.teacher ? String(item.teacher) : null;
        const itemRoom = (item.room || item.class?.room || item.class?.roomNumber || '').trim().toLowerCase();

        // 1. Same Class Conflict
        if (targetClassId && itemClassId === targetClassId) {
          const clsName = item.class?.className || item.class?.name || 'Class';
          const sec = item.class?.section ? ` (${item.class.section})` : '';
          throw ApiError.conflict(
            `Schedule conflict: ${clsName}${sec} already has "${itemActivity}" scheduled on ${day} from ${item.startTime} to ${item.endTime}.`
          );
        }

        // 2. Same Teacher Conflict
        if (targetTeacherId && itemTeacherId && targetTeacherId === itemTeacherId) {
          const teacherName = item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : 'Teacher';
          const inClass = item.class?.name || item.class?.className ? ` in ${item.class.name || item.class.className}` : '';
          throw ApiError.conflict(
            `Schedule conflict: ${teacherName} is already assigned from ${item.startTime} to ${item.endTime}${inClass} on ${day}.`
          );
        }

        // 3. Same Room / Classroom Conflict
        if (targetRoom && itemRoom && targetRoom === itemRoom) {
          const inClass = item.class?.name || item.class?.className ? ` by ${item.class.name || item.class.className}` : '';
          throw ApiError.conflict(
            `Schedule conflict: Classroom "${candidate.room}" is already booked from ${item.startTime} to ${item.endTime}${inClass} for "${itemActivity}" on ${day}.`
          );
        }
      }
    }
  }

  /**
   * Get all timetable schedules with role-based scoping and filtering
   */
  async getAllSchedules(user, query = {}) {
    const {
      classId,
      class: qClass,
      dayOfWeek,
      day,
      teacherId,
      teacher: qTeacher,
      academicYear,
      search,
    } = query;

    const filter = {};

    // Academic Year filter
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    // Day filter
    const targetDay = day || dayOfWeek;
    if (targetDay) {
      filter.$or = [{ day: targetDay }, { dayOfWeek: targetDay }];
    }

    // Role-based visibility
    if (user && user.role === 'teacher') {
      const teacherDoc = await Teacher.findOne({ user: user._id });
      if (!teacherDoc) return [];

      const assignedClassIds = (teacherDoc.assignedClasses || []).map((id) => String(id));
      const leadClasses = await Class.find({
        $or: [{ teacher: teacherDoc._id }, { classTeacher: teacherDoc._id }],
      }).select('_id');
      const allTeacherClassIds = Array.from(
        new Set([...assignedClassIds, ...leadClasses.map((c) => String(c._id))])
      );

      const requestedClassId = qClass || classId;
      if (requestedClassId) {
        if (!allTeacherClassIds.includes(String(requestedClassId))) {
          // If teacher queries a class they do not teach, check if they are the slot teacher
          filter.class = requestedClassId;
          filter.teacher = teacherDoc._id;
        } else {
          filter.class = requestedClassId;
        }
      } else {
        filter.$and = [
          ...(filter.$or ? [{ $or: filter.$or }] : []),
          {
            $or: [
              { teacher: teacherDoc._id },
              { class: { $in: allTeacherClassIds } },
            ],
          },
        ];
        delete filter.$or;
      }
    } else if (user && user.role === 'parent') {
      const parentDoc = await Parent.findOne({ user: user._id });
      if (!parentDoc) return [];

      const children = await Student.find({
        $or: [{ parent: parentDoc._id }, { _id: { $in: parentDoc.children || [] } }],
      }).select('class');

      const childClassIds = children
        .map((c) => c.class)
        .filter(Boolean)
        .map((id) => String(id));

      const requestedClassId = qClass || classId;
      if (requestedClassId) {
        if (!childClassIds.includes(String(requestedClassId))) {
          return [];
        }
        filter.class = requestedClassId;
      } else {
        filter.class = { $in: childClassIds };
      }
    } else {
      // Admin or unfiltered
      const targetClass = qClass || classId;
      if (targetClass) filter.class = targetClass;

      const targetTeacher = qTeacher || teacherId;
      if (targetTeacher) filter.teacher = targetTeacher;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchFilter = {
        $or: [{ activity: searchRegex }, { activityName: searchRegex }, { notes: searchRegex }],
      };
      if (filter.$and) {
        filter.$and.push(searchFilter);
      } else {
        filter.$and = [searchFilter];
      }
    }

    const schedules = await Schedule.find(filter)
      .populate('class', 'name className section room roomNumber capacity academicYear')
      .populate('teacher', 'firstName lastName email phone employeeId teacherId designation profilePhoto')
      .sort({ dayOfWeek: 1, startTime: 1 });

    return schedules;
  }

  /**
   * Get single schedule slot by ID with role check
   */
  async getScheduleById(id, user) {
    const schedule = await Schedule.findById(id)
      .populate('class', 'name className section room roomNumber capacity academicYear')
      .populate('teacher', 'firstName lastName email phone employeeId teacherId designation profilePhoto');

    if (!schedule) {
      throw ApiError.notFound(`Schedule slot with ID ${id} not found`);
    }

    if (user && user.role === 'teacher') {
      const teacherDoc = await Teacher.findOne({ user: user._id });
      const teacherClassIds = (teacherDoc?.assignedClasses || []).map((c) => String(c));
      const isSlotTeacher = teacherDoc && schedule.teacher && String(schedule.teacher._id) === String(teacherDoc._id);
      const isClassTeacher = teacherDoc && teacherClassIds.includes(String(schedule.class?._id || schedule.class));
      if (!isSlotTeacher && !isClassTeacher) {
        throw ApiError.forbidden('You are not authorized to view this schedule slot');
      }
    } else if (user && user.role === 'parent') {
      const parentDoc = await Parent.findOne({ user: user._id });
      const children = await Student.find({
        $or: [{ parent: parentDoc?._id }, { _id: { $in: parentDoc?.children || [] } }],
      }).select('class');
      const childClassIds = children.map((c) => String(c.class));
      if (!childClassIds.includes(String(schedule.class?._id || schedule.class))) {
        throw ApiError.forbidden('You are not authorized to view this schedule slot');
      }
    }

    return schedule;
  }

  /**
   * Get timetable schedules for a specific class
   */
  async getSchedulesByClass(classId, dayOfWeek, user) {
    return this.getAllSchedules(user, { classId, dayOfWeek });
  }

  /**
   * Create new timetable slot with conflict check
   */
  async createSchedule(data) {
    // Synchronize aliases
    if (data.subject && !data.activity) {
      data.activity = data.subject;
      data.activityName = data.subject;
    }
    if (data.activity && !data.activityName) data.activityName = data.activity;
    if (data.activityName && !data.activity) data.activity = data.activityName;
    if (data.classroom && !data.room) data.room = data.classroom;
    if (data.day && !data.dayOfWeek) data.dayOfWeek = data.day;
    if (data.dayOfWeek && !data.day) data.day = data.dayOfWeek;

    // Check class existence and default missing room / academicYear
    const classExists = await Class.findById(data.class);
    if (!classExists) {
      throw ApiError.badRequest('Referenced class does not exist');
    }

    if (!data.room) {
      data.room = classExists.room || classExists.roomNumber || '';
    }
    if (!data.academicYear) {
      data.academicYear = classExists.academicYear || '2026-2027';
    }
    if (!data.teacher && classExists.classTeacher) {
      data.teacher = classExists.classTeacher;
    } else if (!data.teacher && classExists.teacher) {
      data.teacher = classExists.teacher;
    }

    // Check for scheduling conflicts
    await this.checkConflicts(data);

    const schedule = await Schedule.create(data);
    return await schedule.populate([
      { path: 'class', select: 'name className section room roomNumber capacity academicYear' },
      { path: 'teacher', select: 'firstName lastName email phone employeeId teacherId designation profilePhoto' },
    ]);
  }

  /**
   * Update schedule slot with conflict check
   */
  async updateSchedule(id, updateData) {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw ApiError.notFound(`Schedule slot with ID ${id} not found`);
    }

    // Synchronize aliases
    if (updateData.activity && !updateData.activityName) updateData.activityName = updateData.activity;
    if (updateData.activityName && !updateData.activity) updateData.activity = updateData.activityName;
    if (updateData.day && !updateData.dayOfWeek) updateData.dayOfWeek = updateData.day;
    if (updateData.dayOfWeek && !updateData.day) updateData.day = updateData.dayOfWeek;

    // Merge candidate state to test conflicts
    const candidate = {
      class: updateData.class || schedule.class,
      teacher: updateData.teacher !== undefined ? updateData.teacher : schedule.teacher,
      day: updateData.day || updateData.dayOfWeek || schedule.day || schedule.dayOfWeek,
      startTime: updateData.startTime || schedule.startTime,
      endTime: updateData.endTime || schedule.endTime,
      room: updateData.room !== undefined ? updateData.room : schedule.room,
      academicYear: updateData.academicYear || schedule.academicYear,
    };

    await this.checkConflicts(candidate, id);

    Object.assign(schedule, updateData);
    await schedule.save();

    return await schedule.populate([
      { path: 'class', select: 'name className section room roomNumber capacity academicYear' },
      { path: 'teacher', select: 'firstName lastName email phone employeeId teacherId designation profilePhoto' },
    ]);
  }

  /**
   * Delete schedule slot
   */
  async deleteSchedule(id) {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw ApiError.notFound(`Schedule slot with ID ${id} not found`);
    }

    await Schedule.findByIdAndDelete(id);
    return { message: 'Schedule slot removed successfully' };
  }
}

module.exports = new ScheduleService();
