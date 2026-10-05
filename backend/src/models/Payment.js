const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fee',
      required: [true, 'Fee record is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Cheque', 'Online', 'Other'],
      default: 'Cash',
    },
    transactionId: {
      type: String,
      trim: true,
      default: () => 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000),
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    receiptNumber: {
      type: String,
      trim: true,
      default: () => 'REC-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for backward compatibility with recordedBy
paymentSchema.virtual('recordedBy')
  .get(function () {
    return this.receivedBy;
  })
  .set(function (val) {
    this.receivedBy = val;
  });

// Virtual for backward compatibility with remarks
paymentSchema.virtual('remarks')
  .get(function () {
    return this.notes;
  })
  .set(function (val) {
    this.notes = val;
  });

// Pre-validate hook to populate aliases
paymentSchema.pre('validate', function (next) {
  if (!this.receivedBy && this.recordedBy) {
    this.receivedBy = this.recordedBy;
  }
  if (!this.notes && this.remarks) {
    this.notes = this.remarks;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
