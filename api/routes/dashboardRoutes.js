const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const { getDashboardStats, getHomelessDashboard } = require('../controllers/dashboardController');

// @route   GET /api/v1/dashboard/stats
// @desc    Get dashboard statistics (counts of all user types)
// @access  Private - Admin only
router.get('/stats', protect, authorize('admin'), getDashboardStats);

// @route   GET /api/v1/dashboard/homeless
// @desc    Get dashboard data for homeless users (stats, recent jobs, donations)
// @access  Private - Homeless users and admin
router.get('/homeless', protect, authorize('admin','homeless'), getHomelessDashboard);


module.exports = router;

