const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnalyticsOverview,
  getActivityTrends,
  getFeatureUsage,
  getUsageHeatmap,
  getRecentActivities,
  getUserActivityStats,
  exportActivities,
} = require('../controllers/analyticsController');

// All analytics routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/v1/analytics/overview
// @desc    Get real-time analytics overview
// @access  Private - Admin only
router.get('/overview', getAnalyticsOverview);

// @route   GET /api/v1/analytics/trends
// @desc    Get activity trends over time
// @access  Private - Admin only
router.get('/trends', getActivityTrends);

// @route   GET /api/v1/analytics/features
// @desc    Get feature usage statistics
// @access  Private - Admin only
router.get('/features', getFeatureUsage);

// @route   GET /api/v1/analytics/heatmap
// @desc    Get usage heatmap (hourly activity by day of week)
// @access  Private - Admin only
router.get('/heatmap', getUsageHeatmap);

// @route   GET /api/v1/analytics/activities
// @desc    Get recent activities with pagination
// @access  Private - Admin only
router.get('/activities', getRecentActivities);

// @route   GET /api/v1/analytics/users
// @desc    Get user activity statistics
// @access  Private - Admin only
router.get('/users', getUserActivityStats);

// @route   GET /api/v1/analytics/activities/export
// @desc    Export activities to CSV
// @access  Private - Admin only
router.get('/activities/export', exportActivities);

module.exports = router;

