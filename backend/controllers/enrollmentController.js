const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const Product = require('../models/Product');
const UserActivity = require('../models/UserActivity');

// Helper function to log activity
const logActivity = async (userId, action, details, metadata = {}) => {
  try {
    await UserActivity.create({
      user: userId,
      action,
      details,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Enroll user in a course
const enrollInCourse = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingEnrollment) {
    res.status(400);
    throw new Error('You are already enrolled in this course');
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    user: req.user._id,
    product: productId,
  });

  await enrollment.populate('product', 'name image description');

  // Log activity
  await logActivity(
    req.user._id,
    'course_enrolled',
    `Enrolled in course: ${product.name}`,
    { productId: productId.toString(), productName: product.name }
  );

  res.status(201).json(enrollment);
});

// Update enrollment progress
const updateEnrollment = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { progress, completed } = req.body;

  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }

  // Check if user owns this enrollment (unless admin)
  if (String(enrollment.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this enrollment');
  }

  if (progress !== undefined) {
    enrollment.progress = Math.max(0, Math.min(100, progress));
  }

  if (completed !== undefined) {
    const wasCompleted = enrollment.completed;
    enrollment.completed = completed;

    // Log completion activity
    if (completed && !wasCompleted) {
      const product = await Product.findById(enrollment.product);
      await logActivity(
        req.user._id,
        'course_completed',
        `Completed course: ${product?.name || 'Unknown'}`,
        {
          enrollmentId: enrollmentId.toString(),
          productId: enrollment.product.toString(),
          productName: product?.name,
        }
      );
    }
  }

  await enrollment.save();
  await enrollment.populate('product', 'name image description');

  res.json(enrollment);
});

// Get enrollment by ID
const getEnrollment = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findById(enrollmentId).populate('product');

  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }

  // Check if user owns this enrollment (unless admin)
  if (String(enrollment.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this enrollment');
  }

  res.json(enrollment);
});

module.exports = {
  enrollInCourse,
  updateEnrollment,
  getEnrollment,
};

