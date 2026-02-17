const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createJob,
    getMerchantJobs,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    applyForJob,
    getHomelessApplications,
} = require('../controllers/jobController');

// @route   GET /api/v1/jobs
// @desc    Get all jobs (across all merchants)
// @access  Public (should be Private with admin auth in production)
// IMPORTANT: This route must come before /merchants/:merchantId/jobs to avoid route conflicts
router.get('/jobs', protect, authorize('merchant', 'organization', 'homeless', 'admin'), getAllJobs);

// @route   GET /api/v1/jobs/applications/me
// @desc    Get job applications for the logged-in homeless user
// @access  Private - Homeless only
router.get('/jobs/applications/me', protect, authorize('homeless'), getHomelessApplications);

// @route   GET /api/v1/jobs/:jobId
// @desc    Get single job by ID
// @access  Public
router.get('/jobs/:jobId', protect, authorize('merchant', 'organization', 'homeless', 'admin'), getJobById);

// @route   POST /api/v1/jobs/:jobId/apply
// @desc    Apply for a job
// @access  Private - Homeless only
router.post('/jobs/:jobId/apply', protect, authorize('homeless'), applyForJob);

// @route   POST /api/v1/merchants/:merchantId/jobs
// @desc    Create a new job for a merchant
// @access  Private - Merchant or Organization only
router.post('/merchants/:merchantId/jobs', protect, authorize('merchant', 'organization', 'admin'), createJob);

// @route   GET /api/v1/merchants/:merchantId/jobs
// @desc    Get all jobs for a merchant
// @access  Private - Merchant, Organization, or Admin
router.get('/merchants/:merchantId/jobs', protect, authorize('merchant', 'organization', 'admin'), getMerchantJobs);

// @route   PATCH /api/v1/jobs/:jobId
// @desc    Update a job
// @access  Private - Merchant or Organization only
router.patch('/jobs/:jobId', protect, authorize('merchant', 'organization', 'admin'), updateJob);

// @route   DELETE /api/v1/jobs/:jobId
// @desc    Delete a job (soft delete)
// @access  Private - Merchant, Organization, or Admin
router.delete('/jobs/:jobId', protect, authorize('merchant', 'organization', 'admin'), deleteJob);

module.exports = router;

