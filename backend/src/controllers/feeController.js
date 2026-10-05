const feeService = require('../services/feeService');
const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all fees
 * @route   GET /api/fees
 * @access  Private (Admin, Parent)
 */
const getFees = asyncHandler(async (req, res) => {
  const result = await feeService.getAllFees(req.query, req.user);

  return ApiResponse.success(res, {
    message: 'Fees retrieved successfully',
    data: {
      ...result,
      fees: result.fees,
      data: result.fees,
    },
  });
});

/**
 * @desc    Get fee invoice by ID
 * @route   GET /api/fees/:id
 * @access  Private (Admin, Parent)
 */
const getFeeById = asyncHandler(async (req, res) => {
  const fee = await feeService.getFeeById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Fee invoice details retrieved successfully',
    data: {
      fee,
      data: fee,
    },
  });
});

/**
 * @desc    Get fees for a student
 * @route   GET /api/fees/student/:studentId
 * @access  Private (Admin, Parent)
 */
const getFeesByStudent = asyncHandler(async (req, res) => {
  const fees = await feeService.getFeesByStudent(req.params.studentId, req.user);

  return ApiResponse.success(res, {
    message: 'Student fees retrieved successfully',
    data: {
      fees,
      data: fees,
    },
  });
});

/**
 * @desc    Create new fee invoice
 * @route   POST /api/fees
 * @access  Private (Admin)
 */
const createFee = asyncHandler(async (req, res) => {
  const fee = await feeService.createFee(req.body);

  return ApiResponse.created(res, {
    message: 'Fee invoice generated successfully',
    data: {
      fee,
      data: fee,
    },
  });
});

/**
 * @desc    Update fee invoice
 * @route   PUT /api/fees/:id
 * @access  Private (Admin)
 */
const updateFee = asyncHandler(async (req, res) => {
  const fee = await feeService.updateFee(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'Fee invoice updated successfully',
    data: {
      fee,
      data: fee,
    },
  });
});

/**
 * @desc    Delete fee invoice
 * @route   DELETE /api/fees/:id
 * @access  Private (Admin)
 */
const deleteFee = asyncHandler(async (req, res) => {
  const result = await feeService.deleteFee(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

/**
 * @desc    Record a payment for fee (subroute)
 * @route   POST /api/fees/:id/payment
 * @access  Private (Admin, Parent)
 */
const recordPayment = asyncHandler(async (req, res) => {
  const paymentPayload = {
    ...req.body,
    fee: req.params.id,
  };
  const result = await paymentService.createPayment(paymentPayload, req.user);

  return ApiResponse.created(res, {
    message: result.message,
    data: {
      ...result,
      data: result.payment,
    },
  });
});

/**
 * @desc    Get payment receipt
 * @route   GET /api/fees/payment/:paymentId
 * @access  Private (Admin, Parent)
 */
const getPaymentReceipt = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.paymentId, req.user);

  return ApiResponse.success(res, {
    message: 'Receipt details retrieved successfully',
    data: {
      payment,
      data: payment,
    },
  });
});

module.exports = {
  getFees,
  getFeeById,
  getFeesByStudent,
  createFee,
  updateFee,
  deleteFee,
  recordPayment,
  getPaymentReceipt,
};
