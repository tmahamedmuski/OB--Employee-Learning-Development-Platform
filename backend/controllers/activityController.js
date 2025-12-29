const asyncHandler = require('express-async-handler');
const UserActivity = require('../models/UserActivity');

// Get all user activities (admin only)
const getAllActivities = asyncHandler(async (req, res) => {
  const { user, action, startDate, endDate, limit = 100 } = req.query;

  const filter = {};
  if (user) filter.user = user;
  if (action) filter.action = action;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const activities = await UserActivity.find(filter)
    .populate('user', 'name email role avatarUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json(activities);
});

// Get activities for a specific user (admin only)
const getUserActivities = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const { action, limit = 50 } = req.query;

  const filter = { user: userId };
  if (action) filter.action = action;

  const activities = await UserActivity.find(filter)
    .populate('user', 'name email role avatarUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json(activities);
});

// Get activity statistics (admin only)
const getActivityStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const stats = await UserActivity.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const totalActivities = await UserActivity.countDocuments(filter);
  const uniqueUsers = await UserActivity.distinct('user', filter);

  res.json({
    totalActivities,
    uniqueUsers: uniqueUsers.length,
    actionDistribution: stats,
  });
});

module.exports = {
  getAllActivities,
  getUserActivities,
  getActivityStats,
};

