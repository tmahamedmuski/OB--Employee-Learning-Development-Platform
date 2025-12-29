const express = require('express');
const Enrollment = require('../models/Enrollment');
const { auth } = require('../middleware/auth');
const {
  enrollInCourse,
  updateEnrollment,
  getEnrollment,
} = require('../controllers/enrollmentController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Enroll in a course
router.post('/', enrollInCourse);

// Get user's enrollments
router.get('/', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('product', 'name image description price category')
      .populate('product.category', 'name')
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get enrollment by product ID (check if user is enrolled)
router.get('/product/:productId', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      product: req.params.productId,
    })
      .populate('product', 'name image description price category')
      .populate('product.category', 'name');

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled' });
    }

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get completed enrollments
router.get('/completed', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id, completed: true })
      .populate('product', 'name image description price category')
      .populate('product.category', 'name')
      .sort({ updatedAt: -1 });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get enrollment by ID
router.get('/:enrollmentId', getEnrollment);

// Update enrollment
router.put('/:enrollmentId', updateEnrollment);

module.exports = router;

