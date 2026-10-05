const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      required: [true, 'Please provide contact number'],
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian', 'Parent', 'Other'],
      default: 'Parent',
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyPhone: {
      type: String,
      trim: true,
      default: '',
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Parent', parentSchema);
