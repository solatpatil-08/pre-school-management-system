const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Private (Admin, Parent)
 */
const getPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.getAllPayments(req.query, req.user);

  return ApiResponse.success(res, {
    message: 'Payments retrieved successfully',
    data: {
      ...result,
      payments: result.payments,
      data: result.payments,
    },
  });
});

/**
 * @desc    Record new payment
 * @route   POST /api/payments
 * @access  Private (Admin, Parent)
 */
const createPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.createPayment(req.body, req.user);

  return ApiResponse.created(res, {
    message: result.message,
    data: {
      ...result,
      payment: result.payment,
      data: result.payment,
    },
  });
});

/**
 * @desc    Get single payment receipt by ID
 * @route   GET /api/payments/:id
 * @access  Private (Admin, Parent)
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Payment details retrieved successfully',
    data: {
      payment,
      data: payment,
    },
  });
});

module.exports = {
  getPayments,
  createPayment,
  getPaymentById,
};
