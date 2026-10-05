const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  getPaymentById,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const { recordPaymentValidator } = require('../validators/feeValidator');

// All payment routes require authentication
router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'parent'), getPayments)
  .post(authorize('admin', 'parent'), recordPaymentValidator, createPayment);

router
  .route('/:id')
  .get(authorize('admin', 'parent'), validateObjectId('id'), getPaymentById);

module.exports = router;
