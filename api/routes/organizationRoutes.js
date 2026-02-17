const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const { 
  getAllOrganizations, 
  getOrganizationById,
  getMyOrganization,
  registerOrganization,
  approveOrganization,
  rejectOrganization,
  requestReview,
  resubmitOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationDashboard,
} = require('../controllers/organizationController');

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

// @route   POST /api/v1/organizations/register
// @desc    Register a new organization
// @access  Public
// For organizations, allow multiple document and photo uploads
router.post('/register', upload.fields([
  { name: 'logo', maxCount: 1 }, // Optional organization logo
  { name: 'documents', maxCount: 10 }, // Allow up to 10 documents
  { name: 'photos', maxCount: 10 } // Allow up to 10 photos
]), registerOrganization);

// @route   GET /api/v1/organizations
// @desc    Get all organizations   
// @access  Public
router.get('/', protect, authorize('admin','organization', 'donor'), getAllOrganizations);

// @route   GET /api/v1/organizations/me
// @desc    Get organization for authenticated user
// @access  Private - Organization role only
router.get('/me', protect, authorize('organization'), getMyOrganization);

// @route   GET /api/v1/organizations/me/dashboard
// @desc    Get organization dashboard statistics
// @access  Private - Organization role only
router.get('/me/dashboard', protect, authorize('organization'), getOrganizationDashboard);

// @route   PUT /api/v1/organizations/:id/approve
// @desc    Approve organization
// @access  Private - Admin only
router.put('/:id/approve', protect, authorize('admin'), approveOrganization);

// @route   PUT /api/v1/organizations/:id/reject
// @desc    Reject organization
// @access  Private - Admin only
router.put('/:id/reject', protect, authorize('admin'), rejectOrganization);

// @route   PUT /api/v1/organizations/:id/request-review
// @desc    Request re-review for rejected organization
// @access  Private - Organization only
router.put('/:id/request-review', protect, authorize('organization'), requestReview);

// @route   PUT /api/v1/organizations/:id/resubmit
// @desc    Mark organization as resubmitted after updating details (from mobile app)
// @access  Private - Organization only
router.put('/:id/resubmit', protect, authorize('organization'), resubmitOrganization);



// @route   PUT /api/v1/organizations/:id
// @desc    Update organization details
// @access  Private - Organization or Admin
router.put('/:id', protect, authorize('organization', 'admin'), upload.fields([
  { name: 'logo', maxCount: 1 }, // Optional organization logo
  { name: 'documents', maxCount: 10 }, // Allow up to 10 documents
  { name: 'photos', maxCount: 10 } // Allow up to 10 photos
]), updateOrganization);

// @route   DELETE /api/v1/organizations/:id
// @desc    Soft delete organization
// @access  Private - Admin only
router.delete('/:id', protect, authorize('admin'), deleteOrganization);

// @route   GET /api/v1/organizations/:id
// @desc    Get single organization by ID
// @access  Public
router.get('/:id', getOrganizationById);

module.exports = router;

