const express = require('express');
const {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  getCourseFeedback,
  deleteFeedback,
  getFeedbackStats,
} = require('../controllers/feedbackController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.post('/', submitFeedback);
router.get('/my', getMyFeedback);
router.get('/course/:courseId', getCourseFeedback);
router.get('/stats', getFeedbackStats);

// Admin only routes
router.get('/all', adminOnly, getAllFeedback);
router.delete('/:id', adminOnly, deleteFeedback);

module.exports = router;

