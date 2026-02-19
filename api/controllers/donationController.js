const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const Homeless = require('../models/Homeless');
const Organization = require('../models/Organization');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { creditWallet } = require('../services/walletService');

/**
 * @desc    Create a new donation
 * @route   POST /api/v1/donations
 * @access  Private - Donor, Admin
 */
const createDonation = async (req, res) => {
    try {
        const {
            homelessId,
            donationType,
            amount,
            currency,
            description,
            paymentMethod,
            transactionId,
            notes,
            itemDetails,
            deliveryMethod,
            deliveryAddress,
            deliveryDate
        } = req.body;

        // Get donor ID from authenticated user
        const userId = req.user._id;
        const donor = await Donor.findOne({ userId, isDeleted: false });

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found',
            });
        }

        // Validate required fields
        if (!homelessId || !donationType) {
            return res.status(400).json({
                success: false,
                message: 'Homeless ID and donation type are required',
            });
        }

        // Validate donation type
        if (!['Money', 'Food', 'Clothes', 'Services', 'Other'].includes(donationType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid donation type',
            });
        }

        // Validate amount for Money donations
        if (donationType === 'Money' && (!amount || amount <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required and must be greater than 0 for Money donations',
            });
        }

        // Check if homeless person exists
        const homeless = await Homeless.findById(homelessId);
        if (!homeless || homeless.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Homeless person not found',
            });
        }

        // Get organization ID from homeless person
        const organizationId = homeless.organizationId;

        // Create donation
        const donationData = {
            donorId: donor._id,
            homelessId,
            organizationId,
            donationType,
            amount: donationType === 'Money' ? amount : 0,
            currency: donationType === 'Money' ? (currency || 'USD') : 'USD',
            description: description || '',
            paymentMethod: donationType === 'Money' ? (paymentMethod || null) : null,
            transactionId: transactionId || null,
            notes: notes || '',
            itemDetails: donationType !== 'Money' ? itemDetails : null,
            deliveryMethod: donationType !== 'Money' ? (deliveryMethod || null) : null,
            deliveryAddress: deliveryAddress || null,
            deliveryDate: deliveryDate || null,
            status: 'Pending',
        };

        // Only include receiptNumber if it's provided (not null/undefined/empty string)
        // This prevents unique index conflicts with null values
        // For sparse indexes, undefined fields are not indexed, but null values are
        if (req.body.receiptNumber && req.body.receiptNumber.trim() !== '') {
            donationData.receiptNumber = req.body.receiptNumber.trim();
        }
        // If receiptNumber is not provided, don't include it at all (undefined)
        // This way the sparse index won't index it

        let donation;
        try {
            // Use new Donation() and save() to have more control, or ensure Mongoose doesn't set defaults
            donation = await Donation.create(donationData);
        } catch (createError) {
            // Handle duplicate key error for receiptNumber (index issue)
            if (createError.code === 11000 && createError.keyPattern?.receiptNumber) {
                console.error('Create donation error - receiptNumber index issue:', createError);
                return res.status(500).json({
                    success: false,
                    message: 'Database index configuration error. Please contact administrator to run: node api/scripts/fixDonationIndex.js',
                    error: process.env.NODE_ENV === 'development' ? 'ReceiptNumber index needs to be recreated with sparse: true' : 'Internal server error',
                });
            }
            throw createError; // Re-throw if it's a different error
        }

        // Populate references for response
        await donation.populate('donorId', 'donorFullName donorEmail');
        await donation.populate('homelessId', 'fullName');
        await donation.populate('organizationId', 'orgName');

        res.status(201).json({
            success: true,
            message: 'Donation created successfully',
            data: {
                donation,
            },
        });
    } catch (error) {
        console.error('Create donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating donation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get all donations with filters
 * @route   GET /api/v1/donations
 * @access  Private - Admin, Organization
 */
const getAllDonations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            donationType,
            organizationId,
            donorId,
            homelessId,
            startDate,
            endDate,
            search
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = { isDeleted: false };

        // Role-based filtering
        if (req.user.role === 'organization') {
            // Organizations can only see donations for their homeless people
            const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
            if (org) {
                query.organizationId = org._id;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Organization profile not found',
                });
            }
        } else if (req.user.role === 'homeless') {
            // Homeless users can only see donations made to them
            const homeless = await Homeless.findOne({ userId: req.user._id, isDeleted: false });
            if (homeless) {
                query.homelessId = homeless._id;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Homeless profile not found',
                });
            }
        }

        // Apply filters
        if (status && ['Pending', 'Completed', 'Cancelled', 'Failed'].includes(status)) {
            query.status = status;
        }

        if (donationType && ['Money', 'Food', 'Clothes', 'Services', 'Other'].includes(donationType)) {
            query.donationType = donationType;
        }

        if (organizationId) {
            query.organizationId = organizationId;
        }

        if (donorId) {
            query.donorId = donorId;
        }

        if (homelessId) {
            query.homelessId = homelessId;
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Search filter
        if (search) {
            query.$or = [
                { donationId: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } },
            ];
        }

        // Get total count
        const total = await Donation.countDocuments(query);

        // Get donations with pagination
        const donations = await Donation.find(query)
            .populate('donorId', 'donorFullName donorEmail donorPhoneNumber')
            .populate('homelessId', 'fullName contactEmail contactPhone')
            .populate('organizationId', 'orgName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            message: 'Donations retrieved successfully',
            data: {
                donations,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get all donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching donations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get donation by ID
 * @route   GET /api/v1/donations/:donationId
 * @access  Private - Admin, Organization, Donor
 */
const getDonationById = async (req, res) => {
    try {
        const { donationId } = req.params;

        const donation = await Donation.findOne({
            $or: [
                { _id: donationId },
                { donationId: donationId }
            ],
            isDeleted: false
        })
            .populate('donorId', 'donorFullName donorEmail donorPhoneNumber preferredDonationType')
            .populate('homelessId', 'fullName contactEmail contactPhone age gender')
            .populate('organizationId', 'orgName email contactPhone');

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found',
            });
        }

        // Check access permissions
        if (req.user.role === 'organization') {
            const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
            if (!org || String(org._id) !== String(donation.organizationId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        } else if (req.user.role === 'donor') {
            const donor = await Donor.findOne({ userId: req.user._id, isDeleted: false });
            if (!donor || String(donor._id) !== String(donation.donorId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        } else if (req.user.role === 'homeless') {
            const homeless = await Homeless.findOne({ userId: req.user._id, isDeleted: false });
            if (!homeless || String(homeless._id) !== String(donation.homelessId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Donation retrieved successfully',
            data: {
                donation,
            },
        });
    } catch (error) {
        console.error('Get donation by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching donation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get donations by organization (for organization dashboard)
 * @route   GET /api/v1/donations/organization/:organizationId
 * @access  Private - Organization, Admin
 */
const getDonationsByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const {
            page = 1,
            limit = 10,
            status,
            donationType,
            startDate,
            endDate
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Check if user has access to this organization
        if (req.user.role === 'organization') {
            const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
            if (!org || String(org._id) !== String(organizationId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        }

        // Build query
        const query = {
            organizationId,
            isDeleted: false
        };

        if (status && ['Pending', 'Completed', 'Cancelled', 'Failed'].includes(status)) {
            query.status = status;
        }

        if (donationType && ['Money', 'Food', 'Clothes', 'Services', 'Other'].includes(donationType)) {
            query.donationType = donationType;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Get total count
        const total = await Donation.countDocuments(query);

        // Get donations
        const donations = await Donation.find(query)
            .populate('donorId', 'donorFullName donorEmail donorPhoneNumber')
            .populate('homelessId', 'fullName contactEmail contactPhone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Calculate statistics
        const stats = await Donation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalDonations: { $sum: 1 },
                    completedDonations: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    pendingDonations: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    }
                }
            }
        ]);

        const statistics = stats.length > 0 ? stats[0] : {
            totalAmount: 0,
            totalDonations: 0,
            completedDonations: 0,
            pendingDonations: 0
        };

        res.status(200).json({
            success: true,
            message: 'Organization donations retrieved successfully',
            data: {
                donations,
                statistics,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get donations by organization error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching organization donations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get donations by homeless person
 * @route   GET /api/v1/donations/homeless/:homelessId
 * @access  Private - Homeless, Admin
 */
const getDonationsByHomeless = async (req, res) => {

    try {

        let { homelessId } = req.params;
        const { page = 1, limit = 10, status, donationType } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Check access and get homeless ID
        let finalHomelessId = homelessId;

        if (req.user.role === 'homeless') {
            const homeless = await Homeless.findOne({ userId: req.user._id, isDeleted: false });
            if (!homeless) {

                return res.status(404).json({
                    success: false,
                    message: 'Homeless profile not found. Please ensure your profile is set up.',
                });
            }
            // Homeless users can only access their own donations
            // Always use their own homelessId, regardless of URL parameter
            finalHomelessId = homeless._id;
        } else if (req.user.role !== 'admin') {
            // Only admin and homeless roles can access this endpoint
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only homeless users and admins can access this endpoint.',
            });
        }

        const query = {
            homelessId: finalHomelessId,
            isDeleted: false
        };

        if (status && ['Pending', 'Completed', 'Cancelled', 'Failed'].includes(status)) {
            query.status = status;
        }

        if (donationType && ['Money', 'Food', 'Clothes', 'Services', 'Other'].includes(donationType)) {
            query.donationType = donationType;
        }

        if (donationType && ['Money', 'Food', 'Clothes', 'Services', 'Other'].includes(donationType)) {
            query.donationType = donationType;
        }

        const total = await Donation.countDocuments(query);

        const donations = await Donation.find(query)
            .populate('donorId', 'donorFullName donorEmail donorPhoneNumber')
            .populate('organizationId', 'orgName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Format donations to display homelessAmount in amount field
        const formattedDonations = donations.map(donation => {
            const donationObj = donation.toObject();

            // If completed, use homelessAmount (default to 0 if missing)
            if (donation.status === 'Completed') {
                donationObj.amount = donation.homelessAmount !== undefined && donation.homelessAmount !== null ? donation.homelessAmount : 0;
            }

            return donationObj;
        });

        // Calculate statistics
        const stats = await Donation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'Completed'] },
                                { $ifNull: ['$homelessAmount', 0] },
                                0
                            ]
                        }
                    },
                    totalDonations: { $sum: 1 },
                    completedDonations: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    pendingDonations: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    }
                }
            }
        ]);

        const statistics = stats.length > 0 ? stats[0] : {
            totalAmount: 0,
            totalDonations: 0,
            completedDonations: 0,
            pendingDonations: 0
        };

        res.status(200).json({
            success: true,
            message: 'Homeless donations retrieved successfully',
            data: {
                donations: formattedDonations,
                statistics,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get donations by homeless error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching homeless donations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get donations by donor
 * @route   GET /api/v1/donations/donor/:donorId
 * @access  Private - Donor, Admin
 */
const getDonationsByDonor = async (req, res) => {
    try {
        const { donorId } = req.params;
        const { page = 1, limit = 10, status, donationType } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Check access
        if (req.user.role === 'donor') {
            const donor = await Donor.findOne({ userId: req.user._id, isDeleted: false });
            if (!donor || String(donor._id) !== String(donorId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        }

        const query = {
            donorId,
            isDeleted: false
        };

        if (status) query.status = status;
        if (donationType) query.donationType = donationType;

        const total = await Donation.countDocuments(query);

        const donations = await Donation.find(query)
            .populate('homelessId', 'fullName contactEmail')
            .populate('organizationId', 'orgName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            message: 'Donor donations retrieved successfully',
            data: {
                donations,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get donations by donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching donor donations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Update donation status
 * @route   PATCH /api/v1/donations/:donationId
 * @access  Private - Admin, Organization
 */
const updateDonation = async (req, res) => {
    try {
        const { donationId } = req.params;
        const {
            status,
            notes,
            receiptNumber,
            deliveryDate,
            cancelledReason
        } = req.body;

        const donation = await Donation.findOne({
            $or: [
                { _id: donationId },
                { donationId: donationId }
            ],
            isDeleted: false
        });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found',
            });
        }

        // Check access
        if (req.user.role === 'organization') {
            const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
            if (!org || String(org._id) !== String(donation.organizationId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
        }

        // Update fields
        const updateData = {};
        if (status && ['Pending', 'Completed', 'Cancelled', 'Failed'].includes(status)) {
            updateData.status = status;
            if (status === 'Completed') {
                updateData.completedAt = new Date();

                // Calculate split for Money donations if not already set
                if (donation.donationType === 'Money') {
                    // Fetch homeless to get cut percentage
                    const homeless = await Homeless.findById(donation.homelessId);

                    if (homeless) {
                        const cutPercentage = homeless.organizationCutPercentage || 0;
                        const baseAmount = donation.netAmount && donation.netAmount > 0 ? donation.netAmount : donation.amount;

                        let organizationAmount = 0;
                        let homelessAmount = baseAmount;

                        if (cutPercentage > 0) {
                            organizationAmount = Number((baseAmount * (cutPercentage / 100)).toFixed(2));
                            homelessAmount = Number((baseAmount - organizationAmount).toFixed(2));
                        } else {
                            // If cut is 0, full amount goes to homeless (or whatever previous default was)
                            organizationAmount = 0;
                            homelessAmount = baseAmount;
                        }

                        updateData.organizationAmount = organizationAmount;
                        updateData.homelessAmount = homelessAmount;

                        // Backfill netAmount if missing
                        if (!donation.netAmount || donation.netAmount === 0) {
                            updateData.netAmount = donation.amount;
                        }

                        // Credit Wallet
                        if (organizationAmount > 0) {
                            await creditWallet(
                                donation.organizationId,
                                organizationAmount,
                                donation._id,
                                'Donation',
                                `Commission from manual donation ${donation.donationId}`
                            );
                        }
                    }

                    // Update donor's total donations if not already completed
                    if (donation.status !== 'Completed') {
                        donation.status = 'Completed'; // Temporarily set for method check
                        await donation.updateDonorTotal();
                    }
                }

                // --- Notification Logic ---
                try {
                    // Notify Homeless
                    const homeless = await Homeless.findById(donation.homelessId);
                    if (homeless && homeless.userId) {
                        const homelessUser = await User.findById(homeless.userId);
                        if (homelessUser && homelessUser.fcmTokens && homelessUser.fcmTokens.length > 0) {
                            const amountMsg = donation.donationType === 'Money'
                                ? `${updateData.homelessAmount || donation.amount} ${donation.currency}`
                                : donation.donationType;

                            await NotificationService.sendToMulticast(
                                homelessUser.fcmTokens,
                                'Donation Received! 🎉',
                                `You have received a donation of ${amountMsg}.`,
                                {
                                    type: 'donation',
                                    donationId: donation._id.toString(),
                                    amount: (updateData.homelessAmount || donation.amount).toString(),
                                    currency: donation.currency
                                },
                                homelessUser._id
                            );
                        }
                    }

                    // Notify Organization
                    const organization = await Organization.findById(donation.organizationId);
                    if (organization && organization.userId) {
                        const orgUser = await User.findById(organization.userId);
                        if (orgUser && orgUser.fcmTokens && orgUser.fcmTokens.length > 0) {
                            const amountMsg = donation.donationType === 'Money'
                                ? `${updateData.organizationAmount || 0} ${donation.currency}`
                                : 'items';

                            // Only notify if there is an amount or it's a non-money donation (though logic above implies money split)
                            // For non-money donations, organization might not get a "cut" in the same way, but let's assume they want to know.
                            // However, the prompt specifically asked for "individual amount display for that amount receive".
                            // If organizationAmount is 0, maybe we shouldn't notify or notify with 0? 
                            // Let's notify them of their commission.

                            if (donation.donationType !== 'Money' || (updateData.organizationAmount > 0)) {
                                await NotificationService.sendToMulticast(
                                    orgUser.fcmTokens,
                                    'Donation Commission Received',
                                    `You have received a commission of ${amountMsg} from a donation.`,
                                    {
                                        type: 'donation',
                                        donationId: donation._id.toString(),
                                        amount: (updateData.organizationAmount || 0).toString(),
                                        currency: donation.currency
                                    },
                                    orgUser._id
                                );
                            }
                        }
                    }

                } catch (notifError) {
                    console.error('Error sending donation notifications:', notifError);
                    // Don't fail the update if notification fails
                }
                // --- End Notification Logic ---
            }
            if (status === 'Cancelled') {
                updateData.cancelledAt = new Date();
                if (cancelledReason) updateData.cancelledReason = cancelledReason;
            }
        }

        if (notes !== undefined) updateData.notes = notes;
        if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber;
        if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate;

        const updatedDonation = await Donation.findByIdAndUpdate(
            donation._id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('donorId', 'donorFullName donorEmail')
            .populate('homelessId', 'fullName')
            .populate('organizationId', 'orgName');

        res.status(200).json({
            success: true,
            message: 'Donation updated successfully',
            data: {
                donation: updatedDonation,
            },
        });
    } catch (error) {
        console.error('Update donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating donation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Delete donation (soft delete)
 * @route   DELETE /api/v1/donations/:donationId
 * @access  Private - Admin
 */
const deleteDonation = async (req, res) => {
    try {
        const { donationId } = req.params;

        const donation = await Donation.findOne({
            $or: [
                { _id: donationId },
                { donationId: donationId }
            ],
            isDeleted: false
        });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found',
            });
        }

        // Soft delete
        donation.isDeleted = true;
        donation.deletedAt = new Date();
        await donation.save();

        res.status(200).json({
            success: true,
            message: 'Donation deleted successfully',
        });
    } catch (error) {
        console.error('Delete donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting donation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get my donation history (for logged in donor)
 * @route   GET /api/v1/donations/my-history
 * @access  Private - Donor
 */
const getMyDonationHistory = async (req, res) => {
    try {
        // Ensure user has donor role
        if (!req.user || req.user.role !== 'donor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only donors can access this endpoint.',
            });
        }

        const donor = await Donor.findOne({ userId: req.user._id, isDeleted: false });
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found',
            });
        }

        // Reuse getDonationsByDonor logic by mocking req/res or just calling the logic
        // But since we are inside a controller, it's cleaner to reuse the query logic
        // So I will just implement the query logic here specific for "me"

        const { page = 1, limit = 10, status, donationType } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = {
            donorId: donor._id,
            isDeleted: false
        };

        if (status) query.status = status;
        if (donationType) query.donationType = donationType;

        const total = await Donation.countDocuments(query);

        const donations = await Donation.find(query)
            .populate('homelessId', 'fullName contactEmail')
            .populate('organizationId', 'orgName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            message: 'My donation history retrieved successfully',
            data: {
                donations,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });

    } catch (error) {
        console.error('Get my donation history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching donation history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};


/**
 * @desc    Get donations for the logged-in organization (My History)
 * @route   GET /api/v1/donations/organization/my-history
 * @access  Private - Organization
 */
const getOrganizationDonationHistory = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'organization') {
            return res.status(403).json({ success: false, message: 'Access denied. Organization role required.' });
        }

        const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization profile not found.' });
        }

        const organizationId = org._id;

        const {
            page = 1,
            limit = 10,
            status,
            donationType,
            startDate,
            endDate
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = {
            organizationId,
            isDeleted: false
        };

        if (status && ['Pending', 'Completed', 'Cancelled', 'Failed'].includes(status)) {
            query.status = status;
        }

        if (donationType && ['Money', 'Food', 'Clothes', 'Services', 'Other'].includes(donationType)) {
            query.donationType = donationType;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Get total count
        const total = await Donation.countDocuments(query);

        // Get donations
        const donations = await Donation.find(query)
            .populate('donorId', 'donorFullName donorEmail donorPhoneNumber')
            .populate('homelessId', 'fullName contactEmail contactPhone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Calculate statistics
        const stats = await Donation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalRevenue: { $sum: { $ifNull: ['$organizationAmount', 0] } },
                    totalDonations: { $sum: 1 },
                    completedDonations: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    pendingDonations: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    }
                }
            }
        ]);

        const statistics = stats.length > 0 ? stats[0] : {
            totalAmount: 0,
            totalRevenue: 0,
            totalDonations: 0,
            completedDonations: 0,
            pendingDonations: 0
        };

        res.status(200).json({
            success: true,
            message: 'My organization donations retrieved successfully',
            data: {
                donations,
                statistics,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get my organization donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching organization donations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
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
};

