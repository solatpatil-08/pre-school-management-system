const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    feeType: {
      type: String,
      required: [true, 'Fee type is required'],
      trim: true,
      default: 'Tuition',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2026-2027',
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'PARTIAL', 'OVERDUE'],
      default: 'PENDING',
      uppercase: true,
      trim: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for backward compatibility with totalAmount
feeSchema.virtual('totalAmount')
  .get(function () {
    return this.amount;
  })
  .set(function (val) {
    this.amount = val;
  });

// Virtual for backward compatibility with academicTerm
feeSchema.virtual('academicTerm')
  .get(function () {
    return this.academicYear;
  })
  .set(function (val) {
    this.academicYear = val;
  });

// Virtual for remaining balance
feeSchema.virtual('balance').get(function () {
  return this.remainingAmount !== undefined
    ? this.remainingAmount
    : Math.max(0, (this.amount || 0) - (this.paidAmount || 0));
});

// Pre-validate hook to handle totalAmount fallback and title
feeSchema.pre('validate', function (next) {
  if (this.amount === undefined && this.totalAmount !== undefined) {
    this.amount = this.totalAmount;
  }
  if (!this.title) {
    this.title = `${this.feeType || 'Tuition'} Fee`;
  }
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  next();
});

// Automatic calculation of remainingAmount and payment status before saving
feeSchema.pre('save', function (next) {
  if (this.amount === undefined && this.totalAmount !== undefined) {
    this.amount = this.totalAmount;
  }
  this.amount = Number(this.amount) || 0;
  this.paidAmount = Number(this.paidAmount) || 0;
  this.remainingAmount = Math.max(0, this.amount - this.paidAmount);

  if (this.paidAmount >= this.amount && this.amount > 0) {
    this.status = 'PAID';
  } else if (this.paidAmount > 0) {
    this.status = 'PARTIAL';
  } else if (new Date(this.dueDate) < new Date()) {
    this.status = 'OVERDUE';
  } else {
    this.status = 'PENDING';
  }
  next();
});

module.exports = mongoose.model('Fee', feeSchema);
