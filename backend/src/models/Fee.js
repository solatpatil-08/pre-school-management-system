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
    annualFees: {
      type: Number,
      default: 0,
      min: [0, 'Annual fees cannot be negative'],
    },
    admissionFees: {
      type: Number,
      default: 0,
      min: [0, 'Admission fees cannot be negative'],
    },
    tuitionFees: {
      type: Number,
      default: 0,
      min: [0, 'Tuition fees cannot be negative'],
    },
    otherFees: {
      type: Number,
      default: 0,
      min: [0, 'Other fees cannot be negative'],
    },
    totalPayableFees: {
      type: Number,
      default: 0,
      min: [0, 'Total payable fees cannot be negative'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    nextPaymentDueDate: {
      type: Date,
      default: null,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Credit Card', 'Debit Card', 'Online', 'Other'],
      default: 'Cash',
    },
    receiptNumber: {
      type: String,
      trim: true,
      default: '',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2026-2027',
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'PARTIAL', 'OVERDUE', 'Paid', 'Partially Paid', 'Pending', 'Overdue'],
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
  if (this.amount === undefined && this.totalPayableFees !== undefined && this.totalPayableFees > 0) {
    this.amount = this.totalPayableFees;
  } else if ((!this.totalPayableFees || this.totalPayableFees === 0) && this.amount !== undefined) {
    this.totalPayableFees = this.amount;
  }
  if (this.amount === undefined && this.totalAmount !== undefined) {
    this.amount = this.totalAmount;
  }
  if (!this.title) {
    this.title = `${this.feeType || 'Tuition'} Fee`;
  }
  if (this.status) {
    const s = String(this.status).toUpperCase();
    if (s.includes('PARTIAL')) this.status = 'PARTIAL';
    else if (s.includes('PAID')) this.status = 'PAID';
    else if (s.includes('OVERDUE')) this.status = 'OVERDUE';
    else this.status = 'PENDING';
  }
  next();
});

// Automatic calculation of remainingAmount and payment status before saving
feeSchema.pre('save', function (next) {
  if (this.amount === undefined && this.totalPayableFees !== undefined && this.totalPayableFees > 0) {
    this.amount = this.totalPayableFees;
  } else if ((!this.totalPayableFees || this.totalPayableFees === 0) && this.amount) {
    this.totalPayableFees = this.amount;
  }
  if (this.amount === undefined && this.totalAmount !== undefined) {
    this.amount = this.totalAmount;
  }
  this.amount = Number(this.amount) || 0;
  this.totalPayableFees = Number(this.totalPayableFees) || this.amount;
  this.paidAmount = Number(this.paidAmount) || 0;
  this.remainingAmount = Math.max(0, this.amount - this.paidAmount);

  if (this.paidAmount >= this.amount && this.amount > 0) {
    this.status = 'PAID';
  } else if (this.paidAmount > 0) {
    this.status = 'PARTIAL';
  } else if (this.dueDate && new Date(this.dueDate) < new Date()) {
    this.status = 'OVERDUE';
  } else {
    this.status = 'PENDING';
  }
  next();
});

module.exports = mongoose.model('Fee', feeSchema);
