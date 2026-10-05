const Payment = require('../models/Payment');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const ApiError = require('../utils/apiError');

class PaymentService {
  /**
   * Get all payments with filters and pagination
   */
  async getAllPayments(query = {}, user = null) {
    const {
      fee,
      feeId,
      student,
      studentId,
      paymentMethod,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = query;

    const filter = {};

    // Role-based scoping for parent
    if (user && user.role === 'parent') {
      const parentRecord = await Parent.findOne({ user: user._id });
      if (!parentRecord || !parentRecord.children || parentRecord.children.length === 0) {
        return {
          payments: [],
          total: 0,
          page: Number(page),
          pages: 0,
          metrics: { totalAmountCollected: 0, transactionCount: 0 },
        };
      }
      filter.student = { $in: parentRecord.children };
    } else if (student || studentId) {
      filter.student = student || studentId;
    }

    if (fee || feeId) {
      filter.fee = fee || feeId;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    // Search across transactionId, receiptNumber, notes or student name
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingStudents = await Student.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { studentId: searchRegex },
        ],
      }).select('_id');

      const studentIds = matchingStudents.map((s) => s._id);

      filter.$or = [
        { transactionId: searchRegex },
        { receiptNumber: searchRegex },
        { notes: searchRegex },
        { student: { $in: studentIds } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total, allPaymentsForMetrics] = await Promise.all([
      Payment.find(filter)
        .populate({
          path: 'fee',
          select: 'feeType amount totalAmount paidAmount remainingAmount status academicYear dueDate title',
        })
        .populate({
          path: 'student',
          select: 'firstName lastName studentId class avatar',
          populate: { path: 'class', select: 'name section' },
        })
        .populate('receivedBy', 'name email role')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(filter),
      Payment.find(filter).select('amount'),
    ]);

    const totalAmountCollected = allPaymentsForMetrics.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      payments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      metrics: {
        totalAmountCollected,
        transactionCount: total,
      },
    };
  }

  /**
   * Record a payment
   */
  async createPayment(paymentData, user = null) {
    const targetFeeId = paymentData.fee || paymentData.feeId;
    if (!targetFeeId) {
      throw ApiError.badRequest('Fee ID is required to record a payment');
    }

    const fee = await Fee.findById(targetFeeId);
    if (!fee) {
      throw ApiError.notFound(`Fee invoice with ID ${targetFeeId} not found`);
    }

    // Role verification for parent
    if (user && user.role === 'parent') {
      const parentRecord = await Parent.findOne({ user: user._id });
      const childIds = parentRecord?.children?.map((c) => c.toString()) || [];
      if (!childIds.includes(fee.student.toString())) {
        throw ApiError.forbidden('You can only record payments for your own children');
      }
    }

    const amount = Number(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw ApiError.badRequest('Payment amount must be greater than zero');
    }

    const currentFeeAmount = Number(fee.amount !== undefined ? fee.amount : fee.totalAmount) || 0;
    const currentPaid = Number(fee.paidAmount) || 0;
    const remaining = Math.max(0, currentFeeAmount - currentPaid);

    if (amount > remaining) {
      throw ApiError.badRequest(
        `Payment amount ($${amount}) exceeds remaining balance of $${remaining}`
      );
    }

    // Generate unique receipt and transaction IDs if not provided
    const year = new Date().getFullYear();
    const count = await Payment.countDocuments();
    const receiptNumber = paymentData.receiptNumber || `REC-${year}-${String(100000 + count + 1)}`;
    const transactionId = paymentData.transactionId || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const receivedBy = paymentData.receivedBy || paymentData.recordedBy || (user ? user._id : null);
    const notes = paymentData.notes || paymentData.remarks || '';

    // Create payment transaction
    const payment = await Payment.create({
      fee: fee._id,
      student: fee.student,
      amount,
      paymentMethod: paymentData.paymentMethod || 'Online',
      transactionId,
      receiptNumber,
      paymentDate: paymentData.paymentDate || new Date(),
      receivedBy,
      notes,
    });

    // Update fee: increment paidAmount
    fee.paidAmount = currentPaid + amount;

    // Automatic calculation of remainingAmount and status occurs in Fee pre-save hook
    await fee.save();

    // Populate payment details
    const populatedPayment = await Payment.findById(payment._id)
      .populate('fee')
      .populate({
        path: 'student',
        select: 'firstName lastName studentId class parent avatar',
        populate: [
          { path: 'class', select: 'name section roomNumber' },
          { path: 'parent', select: 'firstName lastName phone email' },
        ],
      })
      .populate('receivedBy', 'name email role');

    return {
      message: 'Payment successfully recorded',
      payment: populatedPayment,
      fee,
      receipt: populatedPayment,
    };
  }

  /**
   * Get single payment by ID (Receipt voucher)
   */
  async getPaymentById(id, user = null) {
    const payment = await Payment.findById(id)
      .populate({
        path: 'fee',
        select: 'title feeType amount totalAmount paidAmount remainingAmount status academicYear dueDate description',
      })
      .populate({
        path: 'student',
        select: 'firstName lastName studentId class parent avatar',
        populate: [
          { path: 'class', select: 'name section roomNumber' },
          { path: 'parent', select: 'firstName lastName phone email address' },
        ],
      })
      .populate('receivedBy', 'name email role');

    if (!payment) {
      throw ApiError.notFound(`Payment record with ID ${id} not found`);
    }

    if (user && user.role === 'parent') {
      const parentRecord = await Parent.findOne({ user: user._id });
      const childIds = parentRecord?.children?.map((c) => c.toString()) || [];
      if (!childIds.includes(payment.student?._id?.toString())) {
        throw ApiError.forbidden('You do not have permission to view this receipt');
      }
    }

    return payment;
  }
}

module.exports = new PaymentService();
