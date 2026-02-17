const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const { getAllDonors, getDonorById, getMyDonor, registerDonor, updateDonor, deleteDonor, getDashboardStats } = require('../controllers/donorController');

// @route   POST /api/v1/donors/register
// @desc    Register a new donor
// @access  Public
router.post('/register', registerDonor);

// @route   GET /api/v1/donors
// @desc    Get all donors
// @access  Public (should be Private with admin auth in production)
// IMPORTANT: This route must come before /:id to avoid route conflicts
router.get('/', getAllDonors);

// @route   GET /api/v1/donors/me
// @desc    Get donor for authenticated user
// @access  Private - Donor role only
router.get('/me', protect, authorize('donor'), getMyDonor);

// @route   GET /api/v1/donors/dashboard
// @desc    Get donor dashboard statistics
// @access  Private - Donor role only
router.get('/dashboard', protect, authorize('donor'), getDashboardStats);

// @route   PUT /api/v1/donors/:id
// @desc    Update donor details
// @access  Private - Donor or Admin
router.put('/:id', protect, authorize('donor', 'admin'), updateDonor);

// @route   DELETE /api/v1/donors/:id
// @desc    Soft delete donor
// @access  Private - Admin only
router.delete('/:id', protect, authorize('admin'), deleteDonor);

// @route   GET /api/v1/donors/:id
// @desc    Get single donor by ID
// @access  Public
router.get('/:id', getDonorById);

module.exports = router;
