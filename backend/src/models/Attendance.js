const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    dateString: {
      type: String, // YYYY-MM-DD for exact date querying and indexing
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'Present', 'Absent', 'Late', 'Leave'],
      default: 'PRESENT',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Standardize status to uppercase (PRESENT, ABSENT, LATE, LEAVE) before saving
attendanceSchema.pre('save', function (next) {
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  if (this.date && !this.dateString) {
    const d = new Date(this.date);
    this.dateString = d.toISOString().split('T')[0];
  }
  next();
});

// Compound unique index so one student has only one attendance record per date
attendanceSchema.index({ student: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
