const Donor = require('../models/Donor');
const Donation = require('../models/Donation');
const User = require('../models/User');
const generateToken = require('../services/generateToken');

/**
 * @desc    Get all donors
 * @route   GET /api/v1/donors
 * @access  Public (should be Private with admin auth in production)
 */
const getAllDonors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const searchQuery = search
            ? {
                $or: [
                    { donorFullName: { $regex: search, $options: 'i' } },
                    { donorEmail: { $regex: search, $options: 'i' } },
                    { donorPhoneNumber: { $regex: search, $options: 'i' } },
                    { preferredDonationType: { $regex: search, $options: 'i' } },
                ],
                isDeleted: false, // Exclude deleted records
            }
            : { isDeleted: false }; // Exclude deleted records

        const donors = await Donor.find(searchQuery)
            .populate('userId', 'email isVerified isActive')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Donor.countDocuments(searchQuery);

        const formattedDonors = donors.map((donor) => ({
            id: donor._id.toString(),
            name: donor.donorFullName,
            fullName: donor.donorFullName,
            email: donor.donorEmail || (donor.userId && donor.userId.email) || '',
            phone: donor.donorPhoneNumber || '',
            gender: donor.donorGender || '',
            address: donor.donorAddress || '',
            preferredDonationType: donor.preferredDonationType || '',
            isActive: donor.userId && donor.userId.isActive !== undefined ? donor.userId.isActive : true,
            totalDonations: donor.totalDonations || 0,
            createdAt: donor.createdAt ? new Date(donor.createdAt).toISOString() : '',
            updatedAt: donor.updatedAt ? new Date(donor.updatedAt).toISOString() : '',
        }));

        res.status(200).json({
            success: true,
            data: {
                donors: formattedDonors,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
            message: 'Donors fetched successfully',
        });
    } catch (error) {
        console.error('Get all donors error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching donors',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get donor by authenticated user (for donor users to get their own profile)
 * @route   GET /api/v1/donors/me
 * @access  Private - Donor role only
 */
const getMyDonor = async (req, res) => {
    try {
        // Double-check: Ensure user has donor role (extra security layer)
        if (!req.user || req.user.role !== 'donor') {
            return res.status(403).json({
                success: false,
                message: `Only specific roles can access it.`,
            });
        }

        // Find donor by userId from authenticated user
        const donor = await Donor.findOne({
            userId: req.user._id,
            isDeleted: false,
        })
            .populate('userId', 'email isVerified isActive')
            .lean();

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found for this user',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: donor._id.toString(),
                name: donor.donorFullName,
                fullName: donor.donorFullName,
                email: donor.donorEmail,
                phone: donor.donorPhoneNumber || '',
                gender: donor.donorGender || '',
                address: donor.donorAddress || '',
                preferredDonationType: donor.preferredDonationType || '',
                isActive: donor.userId && donor.userId.isActive !== undefined ? donor.userId.isActive : true,
                userEmail: donor.userId && donor.userId.email ? donor.userId.email : '',
                isUserActive: donor.userId && donor.userId.isActive !== undefined ? donor.userId.isActive : true,
                createdAt: donor.createdAt ? new Date(donor.createdAt).toISOString() : '',
                updatedAt: donor.updatedAt ? new Date(donor.updatedAt).toISOString() : '',
            },
            message: 'Donor fetched successfully',
        });
    } catch (error) {
        console.error('Get my donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching donor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get single donor by ID
 * @route   GET /api/v1/donors/:id
 * @access  Public
 */
const getDonorById = async (req, res) => {
    try {
        const donor = await Donor.findOne({
            _id: req.params.id,
            isDeleted: false,
        })
            .populate('userId', 'email isVerified isActive')
            .lean();

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found',
            });
        }

        // Check if user has a password
        const User = require('../models/User');
        const user = await User.findById(donor.userId).select('+password').lean();
        const hasPassword = user && user.password && user.password.length > 0;

        res.status(200).json({
            success: true,
            data: {
                id: donor._id.toString(),
                name: donor.donorFullName,
                fullName: donor.donorFullName,
                email: donor.donorEmail || (donor.userId && donor.userId.email) || '',
                phone: donor.donorPhoneNumber || '',
                gender: donor.donorGender || '',
                address: donor.donorAddress || '',
                preferredDonationType: donor.preferredDonationType || '',
                isActive: donor.userId && donor.userId.isActive !== undefined ? donor.userId.isActive : true,
                userEmail: donor.userId && donor.userId.email ? donor.userId.email : '',
                hasPassword: hasPassword,
                createdAt: donor.createdAt ? new Date(donor.createdAt).toISOString() : '',
                updatedAt: donor.updatedAt ? new Date(donor.updatedAt).toISOString() : '',
            },
            message: 'Donor fetched successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching donor',
            error: error.message,
        });
    }
};

/**
 * @desc    Register a new donor
 * @route   POST /api/v1/donors/register
 * @access  Public
 */
const registerDonor = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phoneNumber,
            password,
            gender,
            address,
            preferredDonationType,
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !phoneNumber || !password || !gender) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: fullName, email, phoneNumber, password, gender',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address',
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long',
            });
        }

        // Validate phone number (basic check - just ensure it's not empty)
        if (!phoneNumber || !phoneNumber.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        // Validate gender
        const validGenders = ['Male', 'Female', 'Prefer Not to Say'];
        if (!validGenders.includes(gender)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid gender. Must be one of: Male, Female, Prefer Not to Say',
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
            });
        }

        // Check if donor email already exists
        const existingDonor = await Donor.findOne({ donorEmail: email.toLowerCase() });
        if (existingDonor) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered as donor',
            });
        }

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            role: 'donor',
            isVerified: false,
            isActive: true,
        });

        // Create donor profile
        const donor = await Donor.create({
            userId: user._id,
            donorFullName: fullName,
            donorEmail: email.toLowerCase(),
            donorPhoneNumber: phoneNumber,
            donorGender: gender,
            donorAddress: address || '',
            preferredDonationType: preferredDonationType || '',
        });

        // Generate JWT token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    isActive: user.isActive,
                },
                donor: {
                    id: donor._id,
                    fullName: donor.donorFullName,
                    email: donor.donorEmail,
                    gender: donor.donorGender,
                },
                token,
            },
            message: 'Donor registered successfully',
        });

    } catch (error) {
        console.error('Donor registration error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors,
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'Server error during donor registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Update donor details
 * @route   PUT /api/v1/donors/:id
 * @access  Public (should be Private with admin auth in production)
 */
const updateDonor = async (req, res) => {
    try {
        const {
            donorFullName,
            donorPhoneNumber,
            donorGender,
            donorAddress,
            preferredDonationType,
            email,
            password,
        } = req.body;

        // Find donor
        const donor = await Donor.findById(req.params.id);

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found',
            });
        }

        if (donor.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update deleted donor',
            });
        }

        // Validate required fields
        if (donorFullName !== undefined && !donorFullName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required',
            });
        }

        if (donorGender !== undefined && !['Male', 'Female', 'Prefer Not to Say'].includes(donorGender)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid gender. Must be Male, Female, or Prefer Not to Say',
            });
        }

        if (preferredDonationType !== undefined && preferredDonationType && !['Money', 'Food', 'Clothes', 'Services', 'Other'].includes(preferredDonationType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid preferred donation type',
            });
        }

        // Update user email and password if provided
        if (email !== undefined || password !== undefined) {
            const User = require('../models/User');
            const user = await User.findById(donor.userId).select('+password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Associated user not found',
                });
            }

            // Validate and update email
            if (email !== undefined) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!email.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email is required',
                    });
                }
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please enter a valid email address',
                    });
                }

                // Check if email is already taken by another user
                const existingUser = await User.findOne({
                    email: email.toLowerCase().trim(),
                    _id: { $ne: user._id }
                });

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email is already registered',
                    });
                }

                user.email = email.toLowerCase().trim();
            }

            // Update password if provided
            if (password !== undefined && password.trim() !== '') {
                // Validate password length
                if (password.length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: 'Password must be at least 8 characters long',
                    });
                }

                user.password = password; // Will be hashed by pre-save hook
            }

            await user.save();
        }

        // Update fields (only update provided fields)
        if (donorFullName !== undefined) donor.donorFullName = donorFullName.trim();
        if (donorPhoneNumber !== undefined) donor.donorPhoneNumber = donorPhoneNumber.trim();
        if (donorGender !== undefined) donor.donorGender = donorGender;
        if (donorAddress !== undefined) donor.donorAddress = donorAddress.trim();
        if (preferredDonationType !== undefined) donor.preferredDonationType = preferredDonationType || '';

        await donor.save();

        // Populate user data for response
        await donor.populate('userId', 'email isVerified isActive');

        res.status(200).json({
            success: true,
            message: 'Donor updated successfully',
            data: {
                id: donor._id.toString(),
                donorFullName: donor.donorFullName,
                donorEmail: donor.donorEmail || (donor.userId && donor.userId.email) || '',
                donorPhoneNumber: donor.donorPhoneNumber,
                donorGender: donor.donorGender,
                donorAddress: donor.donorAddress,
                preferredDonationType: donor.preferredDonationType,
            },
        });
    } catch (error) {
        console.error('Update donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating donor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Soft delete donor
 * @route   DELETE /api/v1/donors/:id
 * @access  Public (should be Private with admin auth in production)
 */
const deleteDonor = async (req, res) => {
    try {
        const donor = await Donor.findById(req.params.id);

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found',
            });
        }

        if (donor.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Donor is already deleted',
            });
        }

        // Soft delete: mark as deleted
        donor.isDeleted = true;
        donor.deletedAt = new Date();
        await donor.save();

        res.status(200).json({
            success: true,
            message: 'Donor deleted successfully',
            data: {
                id: donor._id,
                deletedAt: donor.deletedAt,
            },
        });
    } catch (error) {
        console.error('Delete donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting donor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get donor dashboard statistics
 * @route   GET /api/v1/donors/dashboard
 * @access  Private - Donor role only
 */
const getDashboardStats = async (req, res) => {
    try {
        // Ensure user has donor role
        if (!req.user || req.user.role !== 'donor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only donors can access this endpoint.',
            });
        }

        // Find donor profile
        const donor = await Donor.findOne({ userId: req.user._id, isDeleted: false });

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found',
            });
        }

        // Aggregate statistics for this donor
        const stats = await Donation.aggregate([
            {
                $match: {
                    donorId: donor._id,
                    status: 'Completed',
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalDonatedAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$donationType', 'Money'] },
                                { $ifNull: ['$netAmount', '$amount'] },
                                0
                            ]
                        }
                    },
                    totalDonationsCount: { $sum: 1 },
                    uniqueOrganizations: { $addToSet: '$organizationId' }
                }
            }
        ]);

        const dashboardData = stats.length > 0 ? stats[0] : {
            totalDonatedAmount: 0,
            totalDonationsCount: 0,
            uniqueOrganizations: []
        };

        res.status(200).json({
            success: true,
            message: 'Dashboard statistics fetched successfully',
            data: {
                totalDonated: dashboardData.totalDonatedAmount,
                totalDonations: dashboardData.totalDonationsCount,
                organizationsCount: dashboardData.uniqueOrganizations.length
            }
        });

    } catch (error) {
        console.error('Get donor dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard stats',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
    getAllDonors,
    getDonorById,
    getMyDonor,
    registerDonor,
    updateDonor,
    deleteDonor,
    getDashboardStats,
}