const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads/homeless');
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
const { getDummyUsers, getAllHomeless, getHomelessById, getMyHomeless, getMyOrganization, getHomelessByOrganization, registerHomeless, updateHomeless, deleteHomeless } = require('../controllers/homelessController');

 

// @route   POST /api/v1/homeless/register
// @desc    Register a new homeless user
// @access  Public
router.post('/register', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'verificationDocument', maxCount: 1 }
]), registerHomeless);

// @route   GET /api/v1/homeless
// @desc    Get all homeless users
// @access  Private
router.get('/', protect, authorize('homeless','admin','donor'), getAllHomeless);

// @route   GET /api/v1/homeless/me
// @desc    Get homeless user for authenticated user
// @access  Private - Homeless role only
router.get('/me', protect, authorize('homeless'), getMyHomeless);

// @route   GET /api/v1/homeless/me/organization
// @desc    Get organization for authenticated homeless user
// @access  Private - Homeless role only
router.get('/me/organization', protect, authorize('homeless','admin','donor'), getMyOrganization);

// @route   GET /api/v1/homeless/organization/:organizationId
// @desc    Get all homeless users by organization ID
// @access  Private
router.get('/organization/:organizationId', protect, getHomelessByOrganization);

// @route   PUT /api/v1/homeless/:id
// @desc    Update homeless user details
// @access  Private - Homeless or Admin
router.put('/:id', protect, authorize('homeless', 'admin', 'organization'), upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'verificationDocument', maxCount: 1 }
]), updateHomeless);

// @route   DELETE /api/v1/homeless/:id
// @desc    Soft delete homeless user
// @access  Private - Admin only
router.delete('/:id', protect, authorize('admin','organization'), deleteHomeless);

// @route   GET /api/v1/homeless/:id
// @desc    Get single homeless user by ID
// @access  Public
router.get('/:id',protect, authorize('homeless', 'admin', 'organization','donor'), getHomelessById);

module.exports = router;

