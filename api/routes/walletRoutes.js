const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getMyWallet,
    getWalletTransactions
} = require('../controllers/walletController');

/**
 * @desc    Get my wallet details
 * @route   GET /api/v1/wallet
 * @access  Private (Organization)
 */
router.get('/', protect, authorize('organization'), getMyWallet);

/**
 * @desc    Get wallet transactions
 * @route   GET /api/v1/wallet/transactions
 * @access  Private (Organization)
 */
router.get('/transactions', protect, authorize('organization'), getWalletTransactions);

module.exports = router;
