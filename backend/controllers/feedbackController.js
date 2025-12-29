const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');
const Product = require('../models/Product');
const UserActivity = require('../models/UserActivity');

// Submit feedback
const submitFeedback = asyncHandler(async (req, res) => {
  const { course, rating, difficulty, content } = req.body;
  const user = req.user._id;

  if (!course || !rating || !difficulty || !content) {
    res.status(400);
    throw new Error('Course, rating, difficulty, and content are required');
  }

  // Verify course exists
  const courseExists = await Product.findById(course);
  if (!courseExists) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if user already submitted feedback for this course
  const existingFeedback = await Feedback.findOne({ user, course });
  if (existingFeedback) {
    res.status(400);
    throw new Error('You have already submitted feedback for this course');
  }

  const feedback = await Feedback.create({
    user,
    course,
    rating,
    difficulty,
    content,
  });

  // Log activity
  await UserActivity.create({
    user,
    action: 'feedback_submitted',
    details: `Submitted feedback for course: ${courseExists.name}`,
    metadata: { course: course, rating, difficulty },
  });

  const populatedFeedback = await Feedback.findById(feedback._id)
    .populate('user', 'name email')
    .populate('course', 'name');

  res.status(201).json(populatedFeedback);
});

// Get feedback for current user
const getMyFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const feedback = await Feedback.find({ user: userId })
    .populate('course', 'name image')
    .sort({ createdAt: -1 });

  res.json(feedback);
});

// Get all feedback (admin only)
const getAllFeedback = asyncHandler(async (req, res) => {
  const { course, rating, difficulty } = req.query;

  const filter = {};
  if (course) filter.course = course;
  if (rating) filter.rating = parseInt(rating);
  if (difficulty) filter.difficulty = difficulty;

  const feedback = await Feedback.find(filter)
    .populate('user', 'name email role avatarUrl')
    .populate('course', 'name image')
    .sort({ createdAt: -1 });

  res.json(feedback);
});

// Get feedback for a specific course
const getCourseFeedback = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;

  const feedback = await Feedback.find({ course: courseId })
    .populate('user', 'name email avatarUrl')
    .sort({ createdAt: -1 });

  res.json(feedback);
});

// Delete feedback (admin only)
const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    res.status(404);
    throw new Error('Feedback not found');
  }

  await Feedback.findByIdAndDelete(req.params.id);

  // Log activity
  await UserActivity.create({
    user: req.user._id,
    action: 'feedback_submitted',
    details: `Admin deleted feedback for course: ${feedback.course}`,
    metadata: { feedbackId: req.params.id },
  });

  res.json({ message: 'Feedback deleted' });
});

// Get feedback statistics
const getFeedbackStats = asyncHandler(async (req, res) => {
  const stats = await Feedback.aggregate([
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratings: {
          $push: '$rating',
        },
        difficulties: {
          $push: '$difficulty',
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return res.json({
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      difficultyDistribution: { easy: 0, 'just-right': 0, challenging: 0, difficult: 0 },
    });
  }

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats[0].ratings.forEach((rating) => {
    ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
  });

  const difficultyDistribution = { easy: 0, 'just-right': 0, challenging: 0, difficult: 0 };
  stats[0].difficulties.forEach((difficulty) => {
    difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
  });

  res.json({
    totalFeedback: stats[0].totalFeedback,
    averageRating: Math.round(stats[0].averageRating * 10) / 10,
    ratingDistribution,
    difficultyDistribution,
  });
});

module.exports = {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  getCourseFeedback,
  deleteFeedback,
  getFeedbackStats,
};

