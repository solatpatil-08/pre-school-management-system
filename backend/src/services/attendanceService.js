const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const ApiError = require('../utils/apiError');

/**
 * Standardize status to uppercase (PRESENT, ABSENT, LATE, LEAVE)
 */
function normalizeStatus(status) {
  if (!status || typeof status !== 'string') return 'PRESENT';
  const upper = status.trim().toUpperCase();
  if (['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].includes(upper)) {
    return upper;
  }
  return 'PRESENT';
}

/**
 * Safely parse date string into YYYY-MM-DD without UTC timezone offset corruption
 */
function normalizeDateString(dateVal) {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  if (typeof dateVal === 'string') {
    const match = dateVal.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

class AttendanceService {
  /**
   * Helper to retrieve assigned class IDs for a teacher
   */
  async _getTeacherClassIds(userId) {
    const teacherDoc = await Teacher.findOne({ user: userId });
    if (!teacherDoc) return [];

    const assignedIds = (teacherDoc.assignedClasses || []).map((id) => String(id));
    const leadClasses = await Class.find({
      $or: [{ teacher: teacherDoc._id }, { classTeacher: teacherDoc._id }],
    }).select('_id');

    return Array.from(new Set([...assignedIds, ...leadClasses.map((c) => String(c._id))]));
  }

  /**
   * Get attendance records with role scoping and statistics
   */
  async getAttendance(user, query = {}) {
    const { classId, class: qClass, date, dateString, studentId, student: qStudent, status, startDate, endDate, search, section, division } = query;
    const filter = {};

    let targetClass = classId || qClass;

    // Support looking up class by name & section if passed
    if (!targetClass && query.className) {
      const clsDoc = await Class.findOne({
        $or: [{ name: query.className }, { className: query.className }],
        ...(section || division ? { section: section || division } : {}),
      });
      if (clsDoc) targetClass = clsDoc._id;
    }
    const targetStudent = studentId || qStudent;

    // 1. Role-based scoping
    if (user && user.role === 'teacher') {
      const permittedClassIds = await this._getTeacherClassIds(user._id);
      if (targetClass) {
        if (!permittedClassIds.includes(String(targetClass))) {
          throw ApiError.forbidden('You are only authorized to view attendance for your assigned classes');
        }
        filter.class = targetClass;
      } else {
        filter.class = { $in: permittedClassIds };
      }
    } else if (user && user.role === 'parent') {
      const parentDoc = await Parent.findOne({ user: user._id });
      if (!parentDoc) return { records: [], stats: { total: 0, present: 0, absent: 0, late: 0, leave: 0, attendanceRate: 0 } };

      const children = await Student.find({
        $or: [{ parent: parentDoc._id }, { _id: { $in: parentDoc.children || [] } }],
      }).select('_id');

      const childIds = children.map((c) => c._id);
      if (targetStudent) {
        if (!childIds.some((id) => String(id) === String(targetStudent))) {
          throw ApiError.forbidden("You can only view your own child's attendance");
        }
        filter.student = targetStudent;
      } else {
        filter.student = { $in: childIds };
      }
    } else {
      // Admin or unfiltered
      if (targetClass) filter.class = targetClass;
      if (targetStudent) filter.student = targetStudent;
    }

    // 2. Date filtering
    if (dateString) {
      filter.dateString = dateString;
    } else if (date) {
      const d = new Date(date);
      filter.dateString = d.toISOString().split('T')[0];
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }

    // 3. Status filtering
    if (status && status !== 'ALL' && status !== 'All') {
      const upperStatus = status.toUpperCase();
      filter.$or = [{ status: upperStatus }, { status }];
    }

    const records = await Attendance.find(filter)
      .populate('student', 'firstName lastName studentId profilePhoto gender')
      .populate('class', 'name className section roomNumber room')
      .populate('markedBy', 'name email role')
      .sort({ date: -1, createdAt: -1 });

    // Client-side / regex search filtering on populated fields if query provided
    let filteredRecords = records;
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filteredRecords = records.filter((r) => {
        const fullName = `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.toLowerCase();
        const stId = (r.student?.studentId || '').toLowerCase();
        const remarks = (r.remarks || '').toLowerCase();
        const className = (r.class?.className || r.class?.name || '').toLowerCase();
        return fullName.includes(s) || stId.includes(s) || remarks.includes(s) || className.includes(s);
      });
    }

    // 4. Compute statistics
    const total = filteredRecords.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    filteredRecords.forEach((r) => {
      const st = (r.status || '').toUpperCase();
      if (st === 'PRESENT') present++;
      else if (st === 'ABSENT') absent++;
      else if (st === 'LATE') late++;
      else if (st === 'LEAVE') leave++;
    });

    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      records: filteredRecords,
      stats: {
        total,
        present,
        absent,
        late,
        leave,
        attendanceRate: rate,
      },
    };
  }

  /**
   * Mark individual student attendance (with duplicate prevention and role guard)
   */
  async markSingleAttendance(data, user, options = {}) {
    const studentId = data.student || data.studentId;
    const classId = data.class || data.classId;
    const { date, remarks } = data;
    const status = normalizeStatus(data.status);
    const dateString = normalizeDateString(data.dateString || date);
    const d = new Date(dateString + 'T00:00:00.000Z');

    // Check teacher authorization
    if (user && user.role === 'teacher') {
      const permittedClassIds = await this._getTeacherClassIds(user._id);
      const studentDoc = await Student.findById(studentId);
      if (!studentDoc || !permittedClassIds.includes(String(studentDoc.class))) {
        throw ApiError.forbidden('You are only authorized to mark attendance for students in your assigned classes');
      }
    } else if (user && user.role === 'parent') {
      throw ApiError.forbidden('Parents are not authorized to mark attendance');
    }

    // Explicit duplicate prevention if requested
    if (options.preventDuplicates || data.preventDuplicates) {
      const existing = await Attendance.findOne({ student: studentId, dateString });
      if (existing) {
        throw ApiError.conflict(
          `Attendance is already recorded for this student on ${dateString}. Please use PUT /api/attendance/:id to update.`
        );
      }
    }

    // Atomic upsert: prevents duplicate documents on the same date for the same student
    const record = await Attendance.findOneAndUpdate(
      { student: studentId, dateString },
      {
        student: studentId,
        class: classId,
        date: d,
        dateString,
        status,
        remarks: remarks || '',
        markedBy: user._id,
      },
      { new: true, upsert: true, runValidators: true }
    )
      .populate('student', 'firstName lastName studentId profilePhoto')
      .populate('class', 'name className section')
      .populate('markedBy', 'name email role');

    return record;
  }

  /**
   * Bulk mark class attendance for a given date
   */
  async markBulkAttendance(payload, user) {
    const { classId, date } = payload;
    const attendanceData = payload.attendanceData || payload.records || [];
    const dateString = normalizeDateString(payload.dateString || date);
    const d = new Date(dateString + 'T00:00:00.000Z');

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      throw ApiError.badRequest('Attendance items must be a non-empty array');
    }

    if (user && user.role === 'teacher') {
      const permittedClassIds = await this._getTeacherClassIds(user._id);
      if (!permittedClassIds.includes(String(classId))) {
        throw ApiError.forbidden('You are only authorized to mark attendance for your assigned classes');
      }
    } else if (user && user.role === 'parent') {
      throw ApiError.forbidden('Parents are not authorized to mark attendance');
    }

    const existingCount = await Attendance.countDocuments({ class: classId, dateString });

    // Perform atomic upserts to prevent duplicate records per student/date
    const operations = attendanceData.map((item) => {
      const studentId = item.studentId || item.student;
      return {
        updateOne: {
          filter: { student: studentId, dateString },
          update: {
            $set: {
              student: studentId,
              class: classId,
              date: d,
              dateString,
              status: normalizeStatus(item.status),
              remarks: item.remarks || '',
              markedBy: user._id,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Attendance.bulkWrite(operations);

    const updatedRecords = await Attendance.find({ class: classId, dateString })
      .populate('student', 'firstName lastName studentId profilePhoto')
      .populate('class', 'name className section')
      .populate('markedBy', 'name');

    // Compute stats for this marked batch
    let present = 0, late = 0, absent = 0, leave = 0;
    updatedRecords.forEach((r) => {
      const st = (r.status || '').toUpperCase();
      if (st === 'PRESENT') present++;
      else if (st === 'LATE') late++;
      else if (st === 'ABSENT') absent++;
      else if (st === 'LEAVE') leave++;
    });
    const total = updatedRecords.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    const message = existingCount > 0 ? 'Attendance saved successfully.' : 'Attendance saved successfully.';

    return {
      message,
      alreadyExisted: existingCount > 0,
      recordsCount: updatedRecords.length,
      records: updatedRecords,
      stats: {
        total,
        present,
        late,
        absent,
        leave,
        attendanceRate: rate,
      },
      bulkResult: result,
    };
  }

  /**
   * Get attendance history and statistics for a single student
   */
  async getStudentAttendance(studentId, user, query = {}) {
    const { startDate, endDate } = query;

    // Verify parent role restriction
    if (user && user.role === 'parent') {
      const parentDoc = await Parent.findOne({ user: user._id });
      const isChild = await Student.findOne({
        _id: studentId,
        $or: [{ parent: parentDoc?._id }, { _id: { $in: parentDoc?.children || [] } }],
      });
      if (!isChild) {
        throw ApiError.forbidden("You can only view your own child's attendance");
      }
    } else if (user && user.role === 'teacher') {
      const permittedClassIds = await this._getTeacherClassIds(user._id);
      const student = await Student.findById(studentId);
      if (!student || !permittedClassIds.includes(String(student.class))) {
        throw ApiError.forbidden('You are only authorized to view attendance for students in your assigned classes');
      }
    }

    const filter = { student: studentId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }

    const records = await Attendance.find(filter)
      .populate('class', 'name className section roomNumber room')
      .populate('markedBy', 'name email role')
      .sort({ date: -1 });

    const totalDays = records.length;
    let presentDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    records.forEach((r) => {
      const st = (r.status || '').toUpperCase();
      if (st === 'PRESENT') presentDays++;
      else if (st === 'LATE') lateDays++;
      else if (st === 'ABSENT') absentDays++;
      else if (st === 'LEAVE') leaveDays++;
    });

    const rate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

    return {
      records,
      attendance: records,
      stats: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        attendanceRate: rate,
      },
    };
  }

  /**
   * Update attendance record (PUT /api/attendance/:id)
   */
  async updateAttendance(id, updateData, user) {
    const record = await Attendance.findById(id);
    if (!record) {
      throw ApiError.notFound(`Attendance record with ID ${id} not found`);
    }

    // Role authorization check
    if (user && user.role === 'teacher') {
      const permittedClassIds = await this._getTeacherClassIds(user._id);
      if (!permittedClassIds.includes(String(record.class))) {
        throw ApiError.forbidden('You are only authorized to update attendance for your assigned classes');
      }
    } else if (user && user.role === 'parent') {
      throw ApiError.forbidden('Parents are not authorized to update attendance records');
    }

    // Update status
    if (updateData.status) {
      record.status = normalizeStatus(updateData.status);
    }

    // Update remarks
    if (updateData.remarks !== undefined) {
      record.remarks = updateData.remarks;
    }

    // Update date if provided and check for duplicates
    if (updateData.date) {
      const d = new Date(updateData.date);
      const newDateString = d.toISOString().split('T')[0];

      if (newDateString !== record.dateString) {
        const duplicate = await Attendance.findOne({
          _id: { $ne: id },
          student: record.student,
          dateString: newDateString,
        });
        if (duplicate) {
          throw ApiError.conflict(`An attendance record already exists for this student on ${newDateString}`);
        }
        record.date = d;
        record.dateString = newDateString;
      }
    }

    if (updateData.class) {
      record.class = updateData.class;
    }

    record.markedBy = user._id;
    await record.save();

    return await record.populate([
      { path: 'student', select: 'firstName lastName studentId profilePhoto' },
      { path: 'class', select: 'name className section' },
      { path: 'markedBy', select: 'name email role' },
    ]);
  }
}

module.exports = new AttendanceService();
