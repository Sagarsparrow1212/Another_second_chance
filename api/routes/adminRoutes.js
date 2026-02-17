const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authController');
const { sendTestNotification } = require('../controllers/adminController');

// @route   POST /api/admin/login
// @desc    Admin login - Verify admin credentials and return JWT token
// @access  Public
router.post('/login', adminLogin);

// @route   POST /api/admin/push-notification
// @desc    Send test push notification
// @access  Public
router.post('/push-notification', sendTestNotification);

module.exports = router;

