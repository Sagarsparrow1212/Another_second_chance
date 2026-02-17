const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { registerUser, loginUser, sendResetPasswordOtp, resetPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { verifySecurityKey } = require('../middleware/securityKey');

// Configure multer for organization document uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads/organizations');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
// For organizations, allow multiple document and photo uploads
router.post('/register', upload.fields([
    { name: 'documents', maxCount: 10 }, // Allow up to 10 documents
    { name: 'photos', maxCount: 10 } // Allow up to 10 photos
]), registerUser);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/v1/auth/logout
// @desc    Logout user and remove FCM token
// @access  Private
router.post('/logout', protect, require('../controllers/authController').logoutUser);

// @route   POST /api/v1/auth/reset-password-otp
// @desc    Send Reset Password OTP
// @access  Private (Merchant, Organization, Homeless)
router.post(
    '/reset-password-otp',
    verifySecurityKey,
    sendResetPasswordOtp
);


// @route   POST /api/v1/auth/reset-password
// @desc    Reset password with security key
// @access  Private (Security Key)
router.post(
    '/reset-password',
    verifySecurityKey,
    resetPassword
);

module.exports = router;
