const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads/merchants');
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const { protect, authorize } = require('../middleware/auth');
const { getAllMerchants, registerMerchant, getMerchantById, getMyMerchant, updateMerchant, deleteMerchant, getReceivedApplications } = require('../controllers/merchnatController');

// @route   POST /api/v1/merchants/register
// @desc    Register a new merchant
// @access  Public
router.post('/register', upload.fields([
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 },
    { name: 'photoId', maxCount: 1 }
]), registerMerchant);

// @route   GET /api/v1/merchants
// @desc    Get all merchants
// @access  Public
router.get('/', getAllMerchants);

// @route   GET /api/v1/merchants/me
// @desc    Get merchant for authenticated user
// @access  Private - Merchant role only
router.get('/me', protect, authorize('merchant'), getMyMerchant);

// @route   GET /api/v1/merchants/applications/received
// @desc    Get all applications for jobs posted by the merchant
// @access  Private - Merchant role only
router.get('/applications/received', protect, authorize('merchant'), getReceivedApplications);

// @route   PUT /api/v1/merchants/:id
// @desc    Update merchant details
// @access  Private - Merchant or Admin
router.put('/:id', protect, authorize('merchant', 'admin'), updateMerchant);

// @route   DELETE /api/v1/merchants/:id
// @desc    Soft delete merchant
// @access  Private - Admin only
router.delete('/:id', protect, authorize('admin'), deleteMerchant);

// @route   GET /api/v1/merchants/:id
// @desc    Get single merchant by ID
// @access  Public
router.get('/:id', getMerchantById);

module.exports = router;
