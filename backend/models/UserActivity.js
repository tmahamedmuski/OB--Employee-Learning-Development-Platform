const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'course_enrolled',
        'course_completed',
        'feedback_submitted',
        'message_sent',
        'message_received',
        'profile_updated',
        'password_changed',
      ],
    },
    details: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);

