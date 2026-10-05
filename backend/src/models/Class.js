const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide class name'],
      trim: true,
    },
    className: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      default: 'A',
    },
    roomNumber: {
      type: String,
      trim: true,
      required: [true, 'Please provide room number'],
    },
    room: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide class capacity'],
      min: [1, 'Capacity must be at least 1'],
      default: 20,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    academicYear: {
      type: String,
      required: [true, 'Please provide academic year'],
      default: '2026-2027',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Archived', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Synchronize className/name, room/roomNumber, classTeacher/teacher
classSchema.pre('save', function (next) {
  if (this.className && !this.name) this.name = this.className;
  else if (this.name && !this.className) this.className = this.name;

  if (this.room && !this.roomNumber) this.roomNumber = this.room;
  else if (this.roomNumber && !this.room) this.room = this.roomNumber;

  if (this.classTeacher && !this.teacher) this.teacher = this.classTeacher;
  else if (this.teacher && !this.classTeacher) this.classTeacher = this.teacher;

  next();
});

// Virtual for enrolled students
classSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'class',
});

// Unique index to prevent duplicate classes in the same section and academic year
classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
