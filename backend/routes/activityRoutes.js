const express = require('express');
const {
  getAllActivities,
  getUserActivities,
  getActivityStats,
} = require('../controllers/activityController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require admin access
router.use(auth);
router.use(adminOnly);

router.get('/', getAllActivities);
router.get('/stats', getActivityStats);
router.get('/user/:userId', getUserActivities);

module.exports = router;

