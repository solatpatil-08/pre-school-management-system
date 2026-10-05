const express = require('express');
const router = express.Router();
const {
  getFees,
  getFeeById,
  getFeesByStudent,
  createFee,
  updateFee,
  deleteFee,
  recordPayment,
  getPaymentReceipt,
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const {
  createFeeValidator,
  updateFeeValidator,
  recordPaymentValidator,
} = require('../validators/feeValidator');

// All fee routes require authentication
router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'parent'), getFees)
  .post(authorize('admin'), createFeeValidator, createFee);

router.get(
  '/student/:studentId',
  authorize('admin', 'parent'),
  validateObjectId('studentId'),
  getFeesByStudent
);

router.get(
  '/payment/:paymentId',
  authorize('admin', 'parent'),
  validateObjectId('paymentId'),
  getPaymentReceipt
);

router
  .route('/:id')
  .get(authorize('admin', 'parent'), validateObjectId('id'), getFeeById)
  .put(authorize('admin'), validateObjectId('id'), updateFeeValidator, updateFee)
  .delete(authorize('admin'), validateObjectId('id'), deleteFee);

router.post(
  '/:id/payment',
  authorize('admin', 'parent'),
  validateObjectId('id'),
  recordPaymentValidator,
  recordPayment
);

module.exports = router;
