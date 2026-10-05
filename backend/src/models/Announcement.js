const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide announcement title'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide announcement message'],
      trim: true,
    },
    targetRole: {
      type: String,
      enum: ['All', 'Teacher', 'Parent'],
      default: 'All',
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Normal', 'High', 'Urgent'],
      default: 'Normal',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook to normalize case of targetRole, status, and priority
announcementSchema.pre('validate', function (next) {
  if (this.targetRole) {
    const lower = String(this.targetRole).toLowerCase();
    if (lower === 'all') this.targetRole = 'All';
    else if (lower === 'teacher') this.targetRole = 'Teacher';
    else if (lower === 'parent') this.targetRole = 'Parent';
  }
  if (this.status) {
    const lower = String(this.status).toLowerCase();
    if (lower === 'draft') this.status = 'Draft';
    else if (lower === 'published') this.status = 'Published';
    else if (lower === 'archived') this.status = 'Archived';
  }
  if (this.priority) {
    const lower = String(this.priority).toLowerCase();
    if (lower === 'low') this.priority = 'Low';
    else if (lower === 'normal') this.priority = 'Normal';
    else if (lower === 'high') this.priority = 'High';
    else if (lower === 'urgent') this.priority = 'Urgent';
  }
  next();
});

// Pre-save hook to ensure publishedAt is set when status is Published
announcementSchema.pre('save', function (next) {
  if (this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);
