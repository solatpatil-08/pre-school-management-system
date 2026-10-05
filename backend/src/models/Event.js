const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide event title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide event description'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Please provide event date'],
    },
    startTime: {
      type: String,
      required: [true, 'Please provide start time'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'Please provide end time'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Campus',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Teacher', 'Parent', 'Student'],
      default: 'All',
    },
    category: {
      type: String,
      enum: ['Academic', 'Sports', 'Cultural', 'Holiday', 'Meeting', 'Workshop'],
      default: 'Academic',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for backward compatibility with eventDate
eventSchema.virtual('eventDate')
  .get(function () {
    return this.date;
  })
  .set(function (val) {
    this.date = val;
  });

// Pre-validate hook to support either date or eventDate and normalize enums
eventSchema.pre('validate', function (next) {
  if (this.date === undefined && this.eventDate !== undefined) {
    this.date = this.eventDate;
  }
  if (!this.date && this.get('eventDate')) {
    this.date = this.get('eventDate');
  }
  if (this.targetAudience) {
    const lower = String(this.targetAudience).toLowerCase();
    if (lower === 'all') this.targetAudience = 'All';
    else if (lower === 'teacher') this.targetAudience = 'Teacher';
    else if (lower === 'parent') this.targetAudience = 'Parent';
    else if (lower === 'student') this.targetAudience = 'Student';
  }
  if (this.category) {
    const lower = String(this.category).toLowerCase();
    if (lower === 'academic') this.category = 'Academic';
    else if (lower === 'sports') this.category = 'Sports';
    else if (lower === 'cultural') this.category = 'Cultural';
    else if (lower === 'holiday') this.category = 'Holiday';
    else if (lower === 'meeting') this.category = 'Meeting';
    else if (lower === 'workshop') this.category = 'Workshop';
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
