const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const ApiError = require('../utils/apiError');

class FeeService {
  /**
   * Get all fees with filters, search, and metrics
   */
  async getAllFees(query = {}, user = null) {
    const {
      status,
      feeType,
      student,
      studentId,
      classId,
      academicYear,
      search,
      overdue,
      pending,
      page = 1,
      limit = 50,
    } = query;

    const filter = {};

    // Role-based scoping: if parent, only show fees for parent's children
    if (user && user.role === 'parent') {
      const parentRecord = await Parent.findOne({ user: user._id });
      if (!parentRecord || !parentRecord.children || parentRecord.children.length === 0) {
        return {
          fees: [],
          total: 0,
          page: Number(page),
          pages: 0,
          metrics: {
            totalBilled: 0,
            totalCollected: 0,
            totalPending: 0,
            totalOverdue: 0,
            overdueCount: 0,
            pendingCount: 0,
            partialCount: 0,
            paidCount: 0,
          },
        };
      }
      filter.student = { $in: parentRecord.children };
    } else if (student || studentId) {
      filter.student = student || studentId;
    } else if (classId) {
      const studentsInClass = await Student.find({ class: classId }).select('_id');
      const studentIds = studentsInClass.map((s) => s._id);
      filter.student = { $in: studentIds };
    }

    // Specific filters
    if (feeType) {
      filter.feeType = feeType;
    }

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    // Status filtering
    if (status) {
      filter.status = status.toUpperCase();
    } else if (overdue === 'true' || overdue === true) {
      filter.status = 'OVERDUE';
    } else if (pending === 'true' || pending === true) {
      filter.status = { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] };
    }

    // Text search on student or fee
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingStudents = await Student.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { studentId: searchRegex },
        ],
      }).select('_id');

      const matchedStudentIds = matchingStudents.map((s) => s._id);

      filter.$or = [
        { student: { $in: matchedStudentIds } },
        { feeType: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    // Fetch fees and total count
    const [fees, total, allMatchingFeesForMetrics] = await Promise.all([
      Fee.find(filter)
        .populate({
          path: 'student',
          select: 'firstName lastName studentId class parent avatar',
          populate: [
            { path: 'class', select: 'name section roomNumber' },
            { path: 'parent', select: 'firstName lastName phone email' },
          ],
        })
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Fee.countDocuments(filter),
      Fee.find(filter).select('amount totalAmount paidAmount remainingAmount status dueDate'),
    ]);

    // Financial calculations
    let totalBilled = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;

    allMatchingFeesForMetrics.forEach((f) => {
      const amt = Number(f.amount !== undefined ? f.amount : f.totalAmount) || 0;
      const paid = Number(f.paidAmount) || 0;
      const rem = Number(f.remainingAmount !== undefined ? f.remainingAmount : Math.max(0, amt - paid));

      totalBilled += amt;
      totalCollected += paid;
      totalPending += rem;

      const st = (f.status || '').toUpperCase();
      if (st === 'PAID') paidCount++;
      else if (st === 'PARTIAL') partialCount++;
      else if (st === 'OVERDUE') {
        overdueCount++;
        totalOverdue += rem;
      } else {
        pendingCount++;
      }
    });

    return {
      fees,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      metrics: {
        totalBilled,
        totalCollected,
        totalPending,
        totalOverdue,
        overdueCount,
        pendingCount,
        partialCount,
        paidCount,
      },
    };
  }

  /**
   * Get fee by ID with payment history
   */
  async getFeeById(id, user = null) {
    const fee = await Fee.findById(id).populate({
      path: 'student',
      select: 'firstName lastName studentId class parent avatar',
      populate: [
        { path: 'class', select: 'name section roomNumber' },
        { path: 'parent', select: 'firstName lastName phone email' },
      ],
    });

    if (!fee) {
      throw ApiError.notFound(`Fee invoice with ID ${id} not found`);
    }

    // Role check if parent
    if (user && user.role === 'parent') {
      const parentRecord = await Parent.findOne({ user: user._id });
      const childIds = parentRecord?.children?.map((c) => c.toString()) || [];
      if (!childIds.includes(fee.student?._id?.toString())) {
        throw ApiError.forbidden('You do not have permission to view this fee record');
      }
    }

    const payments = await Payment.find({ fee: id })
      .populate('receivedBy', 'name email role')
      .sort({ paymentDate: -1, createdAt: -1 });

    const feeObj = fee.toObject();
    feeObj.payments = payments;

    return feeObj;
  }

  /**
   * Get fees for a specific student
   */
  async getFeesByStudent(studentId, user = null) {
    // If parent, check permission
    if (user && user.role === 'parent') {
      const parentRecord = await Parent.findOne({ user: user._id });
      const childIds = parentRecord?.children?.map((c) => c.toString()) || [];
      if (!childIds.includes(studentId.toString())) {
        throw ApiError.forbidden('You do not have access to fees for this student');
      }
    }

    const fees = await Fee.find({ student: studentId })
      .populate({
        path: 'student',
        select: 'firstName lastName studentId class avatar',
        populate: { path: 'class', select: 'name section' },
      })
      .sort({ dueDate: 1 });

    const enhanced = await Promise.all(
      fees.map(async (f) => {
        const payments = await Payment.find({ fee: f._id })
          .populate('receivedBy', 'name email')
          .sort({ paymentDate: -1 });
        const obj = f.toObject();
        obj.payments = payments;
        return obj;
      })
    );

    return enhanced;
  }

  /**
   * Create new fee (supports single student or whole class)
   */
  async createFee(feeData) {
    const {
      student,
      studentId,
      classId,
      feeType,
      amount,
      totalAmount,
      dueDate,
      academicYear,
      description,
      title,
    } = feeData;

    const feeAmt = Number(amount !== undefined ? amount : totalAmount);
    if (isNaN(feeAmt) || feeAmt < 0) {
      throw ApiError.badRequest('Valid fee amount is required');
    }

    if (!dueDate) {
      throw ApiError.badRequest('Due date is required');
    }

    // Bulk creation if classId is provided without a single student
    if (classId && !student && !studentId) {
      const students = await Student.find({ class: classId, status: 'Active' });
      if (students.length === 0) {
        throw ApiError.badRequest('No active students found in the selected class');
      }

      const createdFees = [];
      for (const st of students) {
        const singleFee = await Fee.create({
          student: st._id,
          feeType: feeType || 'Tuition',
          amount: feeAmt,
          dueDate,
          academicYear: academicYear || '2026-2027',
          description: description || '',
          title: title || `${feeType || 'Tuition'} Fee - ${st.firstName} ${st.lastName}`,
        });
        createdFees.push(singleFee);
      }

      return {
        message: `Successfully created ${createdFees.length} fee records for the class`,
        count: createdFees.length,
        fees: createdFees,
      };
    }

    // Single student creation
    const targetStudentId = student || studentId;
    if (!targetStudentId) {
      throw ApiError.badRequest('Student is required');
    }

    const studentRecord = await Student.findById(targetStudentId);
    if (!studentRecord) {
      throw ApiError.badRequest('Referenced student does not exist');
    }

    const fee = await Fee.create({
      student: targetStudentId,
      feeType: feeType || 'Tuition',
      amount: feeAmt,
      dueDate,
      academicYear: academicYear || '2026-2027',
      description: description || '',
      title: title || `${feeType || 'Tuition'} Fee - ${studentRecord.firstName} ${studentRecord.lastName}`,
    });

    return await fee.populate({
      path: 'student',
      select: 'firstName lastName studentId class',
      populate: { path: 'class', select: 'name section' },
    });
  }

  /**
   * Update fee
   */
  async updateFee(id, updateData) {
    const fee = await Fee.findById(id);
    if (!fee) {
      throw ApiError.notFound(`Fee with ID ${id} not found`);
    }

    if (updateData.amount !== undefined || updateData.totalAmount !== undefined) {
      fee.amount = Number(updateData.amount !== undefined ? updateData.amount : updateData.totalAmount);
    }
    if (updateData.feeType !== undefined) fee.feeType = updateData.feeType;
    if (updateData.dueDate !== undefined) fee.dueDate = updateData.dueDate;
    if (updateData.academicYear !== undefined) fee.academicYear = updateData.academicYear;
    if (updateData.description !== undefined) fee.description = updateData.description;
    if (updateData.title !== undefined) fee.title = updateData.title;
    if (updateData.paidAmount !== undefined) fee.paidAmount = Number(updateData.paidAmount);

    // Save triggers automatic recalculation of remainingAmount and status
    await fee.save();

    return await fee.populate({
      path: 'student',
      select: 'firstName lastName studentId class',
      populate: { path: 'class', select: 'name section' },
    });
  }

  /**
   * Delete fee and linked payments
   */
  async deleteFee(id) {
    const fee = await Fee.findById(id);
    if (!fee) {
      throw ApiError.notFound(`Fee with ID ${id} not found`);
    }

    // Delete all linked payment transactions
    await Payment.deleteMany({ fee: id });
    await Fee.findByIdAndDelete(id);

    return { message: 'Fee record and linked payment receipts deleted successfully' };
  }
}

module.exports = new FeeService();
