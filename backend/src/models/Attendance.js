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
      default: function () {
        if (this.date) {
          if (typeof this.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(this.date)) {
            return this.date.slice(0, 10);
          }
          const d = new Date(this.date);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        }
        return new Date().toISOString().split('T')[0];
      },
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

// Standardize status and dateString before validation
attendanceSchema.pre('validate', function (next) {
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  if (!this.dateString) {
    if (this.date) {
      if (typeof this.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(this.date)) {
        this.dateString = this.date.slice(0, 10);
      } else {
        const d = new Date(this.date);
        this.dateString = isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      }
    } else {
      this.dateString = new Date().toISOString().split('T')[0];
    }
  }
  next();
});

// Standardize status to uppercase (PRESENT, ABSENT, LATE, LEAVE) before saving
attendanceSchema.pre('save', function (next) {
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  if (!this.dateString && this.date) {
    if (typeof this.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(this.date)) {
      this.dateString = this.date.slice(0, 10);
    } else {
      const d = new Date(this.date);
      this.dateString = isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    }
  }
  next();
});

// Compound unique index so one student has only one attendance record per date
attendanceSchema.index({ student: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
