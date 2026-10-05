const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Female',
    },
    qualification: {
      type: String,
      trim: true,
      default: 'Early Childhood Education Diploma',
    },
    designation: {
      type: String,
      trim: true,
      default: 'Lead Teacher',
    },
    specialization: {
      type: String,
      trim: true,
      default: 'General Pre-School Curriculum',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    address: {
      type: String,
      trim: true,
      default: '',
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Synchronize teacherId and employeeId
teacherSchema.pre('save', function (next) {
  if (this.teacherId && !this.employeeId) {
    this.employeeId = this.teacherId;
  } else if (this.employeeId && !this.teacherId) {
    this.teacherId = this.employeeId;
  }
  next();
});

// Virtual for full name
teacherSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Teacher', teacherSchema);
