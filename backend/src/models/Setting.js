const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      default: 'Sunshine Kids Pre-School & Daycare',
      trim: true,
    },
    schoolEmail: {
      type: String,
      default: 'contact@sunshinekids.edu',
      trim: true,
    },
    schoolPhone: {
      type: String,
      default: '+1 (555) 234-5678',
      trim: true,
    },
    schoolAddress: {
      type: String,
      default: '124 Blossom Lane, Sunnyvale, CA 94086',
      trim: true,
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
    },
    currentTerm: {
      type: String,
      default: 'Fall Term',
      trim: true,
    },
    currency: {
      type: String,
      default: 'USD ($)',
      trim: true,
    },
    admissionPrefix: {
      type: String,
      default: 'SKP-',
      trim: true,
    },
    systemNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
