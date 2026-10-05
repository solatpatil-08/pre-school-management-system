const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    activity: {
      type: String,
      trim: true,
    },
    activityName: {
      type: String,
      trim: true,
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: {
      type: String, // e.g. "09:00"
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String, // e.g. "09:45"
      required: [true, 'End time is required'],
      trim: true,
    },
    room: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2026-2027',
    },
    activityType: {
      type: String,
      enum: ['Academic', 'Play', 'Meal', 'Arts & Craft', 'Music & Movement', 'Nap/Rest', 'Outdoor'],
      default: 'Academic',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for subject
scheduleSchema.virtual('subject')
  .get(function () {
    return this.activity || this.activityName;
  })
  .set(function (val) {
    this.activity = val;
    this.activityName = val;
  });

// Synchronize activity/activityName/subject and day/dayOfWeek
scheduleSchema.pre('save', function (next) {
  if (this.activity && !this.activityName) {
    this.activityName = this.activity;
  } else if (this.activityName && !this.activity) {
    this.activity = this.activityName;
  }

  if (this.day && !this.dayOfWeek) {
    this.dayOfWeek = this.day;
  } else if (this.dayOfWeek && !this.day) {
    this.day = this.dayOfWeek;
  }

  next();
});

module.exports = mongoose.model('Schedule', scheduleSchema);
