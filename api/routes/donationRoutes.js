const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createDonation,
    getAllDonations,
    getDonationById,
    getDonationsByOrganization,
    getDonationsByHomeless,
    getDonationsByDonor,
    updateDonation,
    deleteDonation,
    getMyDonationHistory,
    getOrganizationDonationHistory,
} = require('../controllers/donationController');

// @route   POST /api/v1/donations
// @desc    Create a new donation
// @access  Private - Donor, Admin
router.post('/', protect, authorize('donor', 'admin'), createDonation);

// @route   GET /api/v1/donations
// @desc    Get all donations with filters
// @access  Private - Admin, Organization, Homeless
router.get('/', protect, authorize('admin', 'organization', 'homeless'), getAllDonations);

// @route   GET /api/v1/donations/organization/my-history
// @desc    Get my organization's donation history
// @access  Private - Organization
router.get('/organization/my-history', protect, authorize('organization'), getOrganizationDonationHistory);

// @route   GET /api/v1/donations/organization/:organizationId
// @desc    Get donations by organization (with statistics)
// @access  Private - Organization, Admin
router.get('/organization/:organizationId', protect, authorize('organization', 'admin'), getDonationsByOrganization);

// @route   GET /api/v1/donations/donor/:donorId
// @desc    Get donations by donor
// @access  Private - Donor, Admin
router.get('/donor/:donorId', protect, authorize('donor', 'admin'), getDonationsByDonor);

// @route   GET /api/v1/donations/my-history
// @desc    Get my donation history
// @access  Private - Donor
router.get('/my-history', protect, authorize('donor'), getMyDonationHistory);

// @route   GET /api/v1/donations/homeless/me
// @desc    Get my donations (for logged in homeless user)
// @access  Private - Homeless
router.get('/homeless/me', protect, authorize('homeless'), getDonationsByHomeless);

// @route   GET /api/v1/donations/homeless/:homelessId
// @desc    Get donations by homeless person
// @access  Private - Homeless, Admin
router.get('/homeless/:homelessId', protect, authorize('homeless', 'admin'), getDonationsByHomeless);

// @route   GET /api/v1/donations/:donationId
// @desc    Get donation by ID
// @access  Private - Admin, Organization, Donor, Homeless
router.get('/:donationId', protect, authorize('admin', 'organization', 'donor', 'homeless'), getDonationById);

// @route   PATCH /api/v1/donations/:donationId
// @desc    Update donation status
// @access  Private - Admin, Organization
router.patch('/:donationId', protect, authorize('admin', 'organization',), updateDonation);

// @route   DELETE /api/v1/donations/:donationId
// @desc    Delete donation (soft delete)
// @access  Private - Admin
router.delete('/:donationId', protect, authorize('admin'), deleteDonation);

module.exports = router;

