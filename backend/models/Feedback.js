const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'just-right', 'challenging', 'difficult'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate feedback from same user for same course
feedbackSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

