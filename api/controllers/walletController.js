const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Organization = require('../models/Organization');

/**
 * @desc    Get organization wallet details
 * @route   GET /api/v1/wallet
 * @access  Private - Organization
 */
const getMyWallet = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'organization') {
            return res.status(403).json({ success: false, message: 'Access denied. Organization role required.' });
        }

        const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization profile not found.' });
        }

        // Find wallet or return 404 (or create if policy mandates, but usually migration handles it)
        // For robustness, if not found and donations exist, we might want to trigger sync, but for now just return 404/Empty
        let wallet = await Wallet.findOne({ organizationId: org._id });

        if (!wallet) {
            // Lazy create empty wallet if not exists
            wallet = await Wallet.create({
                organizationId: org._id,
                currentBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0
            });
        }

        // Get 5 recent transactions
        const recentTransactions = await WalletTransaction.find({ walletId: wallet._id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            message: 'Wallet details retrieved successfully',
            data: {
                wallet,
                recentTransactions
            }
        });

    } catch (error) {
        console.error('Get wallet details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching wallet details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get wallet transactions
 * @route   GET /api/v1/wallet/transactions
 * @access  Private - Organization
 */
const getWalletTransactions = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'organization') {
            return res.status(403).json({ success: false, message: 'Access denied. Organization role required.' });
        }

        const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization profile not found.' });
        }

        const wallet = await Wallet.findOne({ organizationId: org._id });
        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found.' });
        }

        const { page = 1, limit = 10, type, startDate, endDate } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = { walletId: wallet._id };

        if (type && ['CREDIT', 'DEBIT'].includes(type)) {
            query.type = type;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await WalletTransaction.countDocuments(query);
        const transactions = await WalletTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            message: 'Wallet transactions retrieved successfully',
            data: {
                transactions,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });

    } catch (error) {
        console.error('Get wallet transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching transactions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
    getMyWallet,
    getWalletTransactions
};
