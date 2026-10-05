const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Please provide student ID'],
      unique: true,
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
    dateOfBirth: {
      type: Date,
      required: [true, 'Please provide date of birth'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Please assign a class'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: 'Parent' },
    },
    medicalNotes: {
      type: String,
      trim: true,
      default: 'None',
    },
    allergies: {
      type: String,
      trim: true,
      default: 'None',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Graduated', 'Suspended'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Synchronize phone and contactNumber
studentSchema.pre('save', function (next) {
  if (this.phone && !this.contactNumber) {
    this.contactNumber = this.phone;
  } else if (this.contactNumber && !this.phone) {
    this.phone = this.contactNumber;
  }
  next();
});

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Student', studentSchema);
