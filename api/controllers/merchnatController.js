const Merchant = require('../models/Merchant');
const User = require('../models/User');
const generateToken = require('../services/generateToken');
const path = require('path');

const getAllMerchants = async (req, res) => {

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const searchQuery = search
            ? {
                $or: [
                    { businessName: { $regex: search, $options: 'i' } },
                    { businessEmail: { $regex: search, $options: 'i' } },
                    { businessType: { $regex: search, $options: 'i' } },
                ],
                isDeleted: false, // Exclude deleted records
            }
            : { isDeleted: false }; // Exclude deleted records

        const merchants = await Merchant.find(searchQuery)
            .populate('userId', 'email isVerified isActive')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();


        const total = await Merchant.countDocuments(searchQuery);

        const formattedMerchants = merchants.map((merchant) => ({
            id: merchant._id.toString(),
            businessName: merchant.businessName,
            email: merchant.businessEmail,
            businessEmail: merchant.businessEmail,
            businessType: merchant.businessType,
            phone: merchant.phoneNumber || '',
            address: merchant.streetAddress ?
                `${merchant.streetAddress}${merchant.city ? ', ' + merchant.city : ''}${merchant.state ? ', ' + merchant.state : ''}`.trim()
                : '',
            verified: merchant.userId && merchant.userId.isVerified ? merchant.userId.isVerified : false,
            createdAt: merchant.createdAt ? new Date(merchant.createdAt).toISOString().split('T')[0] : '',
            contactPersonName: merchant.contactPersonName || '',
            contactDesignation: merchant.contactDesignation || '',
            city: merchant.city || '',
            state: merchant.state || '',
        }));

        res.status(200).json({
            success: true,
            data: {
                merchants: formattedMerchants,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
            message: 'Merchants fetched successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching merchants',
            error: error.message,
        });
    }
}

/**
 * @desc    Register a new merchant
 * @route   POST /api/v1/merchants/register
 * @access  Public
 */
const registerMerchant = async (req, res) => {
    try {
        const {
            businessName,
            businessEmail,
            phoneNumber,
            password,
            businessType,
            address,
            city,
            state,
            contactPersonName,
            contactPersonDesignation,
        } = req.body;

        // Validate required fields
        if (!businessName || !businessEmail || !phoneNumber || !password || !businessType || !address || !city || !state) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: businessName, businessEmail, phoneNumber, password, businessType, address, city, state',
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: businessEmail.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
            });
        }

        // Check if business email already exists in Merchant collection
        const existingMerchant = await Merchant.findOne({ businessEmail: businessEmail.toLowerCase() });
        if (existingMerchant) {
            return res.status(400).json({
                success: false,
                message: 'Business email already registered',
            });
        }

        // Create user
        const user = await User.create({
            email: businessEmail.toLowerCase(),
            password,
            role: 'merchant',
            isVerified: false,
            isActive: true,
        });

        // Handle file uploads - multer handles file saving
        let gstCertificatePath = null;
        let businessLicensePath = null;
        let photoIdPath = null;

        // Handle file uploads from multer
        if (req.files) {
            if (req.files.gstCertificate && req.files.gstCertificate[0]) {
                gstCertificatePath = `/uploads/merchants/${req.files.gstCertificate[0].filename}`;
            }
            if (req.files.businessLicense && req.files.businessLicense[0]) {
                businessLicensePath = `/uploads/merchants/${req.files.businessLicense[0].filename}`;
            }
            if (req.files.photoId && req.files.photoId[0]) {
                photoIdPath = `/uploads/merchants/${req.files.photoId[0].filename}`;
            }
        }

        // Create merchant profile
        const merchant = await Merchant.create({
            userId: user._id,
            businessName,
            businessEmail: businessEmail.toLowerCase(),
            phoneNumber,
            businessType,
            streetAddress: address,
            city,
            state,
            contactPersonName: contactPersonName || '',
            contactDesignation: contactPersonDesignation || '',
            gstCertificate: gstCertificatePath,
            businessLicense: businessLicensePath,
            photoId: photoIdPath,
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
                merchant: {
                    id: merchant._id,
                    businessName: merchant.businessName,
                    businessEmail: merchant.businessEmail,
                    businessType: merchant.businessType,
                },
                token,
            },
            message: 'Merchant registered successfully',
        });

    } catch (error) {
        console.error('Merchant registration error:', error);

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
                message: 'Email or business email already registered',
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'Server error during merchant registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get merchant by authenticated user (for merchant users to get their own profile)
 * @route   GET /api/v1/merchants/me
 * @access  Private - Merchant role only
 */
const getMyMerchant = async (req, res) => {
    try {
        // Double-check: Ensure user has merchant role (extra security layer)
        if (!req.user || req.user.role !== 'merchant') {
            return res.status(403).json({
                success: false,
                message: `Only specific roles can access it.`,
            });
        }

        // Find merchant by userId from authenticated user
        const merchant = await Merchant.findOne({
            userId: req.user._id,
            isDeleted: false,
        })
            .populate('userId', 'email isVerified isActive')
            .lean();

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found for this user',
            });
        }

        // Format the response
        const formattedMerchant = {
            id: merchant._id.toString(),
            businessName: merchant.businessName,
            businessEmail: merchant.businessEmail,
            email: merchant.businessEmail,
            phoneNumber: merchant.phoneNumber || '',
            businessType: merchant.businessType || '',
            streetAddress: merchant.streetAddress || '',
            city: merchant.city || '',
            state: merchant.state || '',
            zipCode: merchant.zipCode || '',
            country: merchant.country || '',
            contactPersonName: merchant.contactPersonName || '',
            contactDesignation: merchant.contactDesignation || '',
            gstCertificate: merchant.gstCertificate || '',
            businessLicense: merchant.businessLicense || '',
            photoId: merchant.photoId || '',
            verified: merchant.userId && merchant.userId.isVerified ? merchant.userId.isVerified : false,
            isActive: merchant.userId && merchant.userId.isActive !== undefined ? merchant.userId.isActive : true,
            userEmail: merchant.userId && merchant.userId.email ? merchant.userId.email : '',
            isUserVerified: merchant.userId && merchant.userId.isVerified ? merchant.userId.isVerified : false,
            isUserActive: merchant.userId && merchant.userId.isActive !== undefined ? merchant.userId.isActive : true,
            createdAt: merchant.createdAt ? new Date(merchant.createdAt).toISOString() : '',
            updatedAt: merchant.updatedAt ? new Date(merchant.updatedAt).toISOString() : '',
        };

        res.status(200).json({
            success: true,
            data: formattedMerchant,
            message: 'Merchant fetched successfully',
        });
    } catch (error) {
        console.error('Get my merchant error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching merchant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get single merchant by ID
 * @route   GET /api/v1/merchants/:id
 * @access  Public
 */
const getMerchantById = async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.params.id)
            .populate('userId', 'email isVerified isActive')
            .lean();

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found',
            });
        }

        // Check if user has a password
        const User = require('../models/User');
        const user = await User.findById(merchant.userId).select('+password').lean();
        const hasPassword = user && user.password && user.password.length > 0;

        // Format the response
        const formattedMerchant = {
            id: merchant._id.toString(),
            businessName: merchant.businessName,
            businessEmail: merchant.businessEmail,
            email: merchant.businessEmail || (merchant.userId && merchant.userId.email) || '',
            phoneNumber: merchant.phoneNumber || '',
            businessType: merchant.businessType || '',
            streetAddress: merchant.streetAddress || '',
            city: merchant.city || '',
            state: merchant.state || '',
            contactPersonName: merchant.contactPersonName || '',
            contactDesignation: merchant.contactDesignation || '',
            gstCertificate: merchant.gstCertificate || '',
            businessLicense: merchant.businessLicense || '',
            photoId: merchant.photoId || '',
            verified: merchant.userId && merchant.userId.isVerified ? merchant.userId.isVerified : false,
            isActive: merchant.userId && merchant.userId.isActive !== undefined ? merchant.userId.isActive : true,
            userEmail: merchant.userId && merchant.userId.email ? merchant.userId.email : '',
            hasPassword: hasPassword,
            createdAt: merchant.createdAt ? new Date(merchant.createdAt).toISOString() : '',
            updatedAt: merchant.updatedAt ? new Date(merchant.updatedAt).toISOString() : '',
        };

        res.status(200).json({
            success: true,
            data: formattedMerchant,
            message: 'Merchant fetched successfully',
        });
    } catch (error) {
        console.error('Get merchant by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching merchant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Update merchant details
 * @route   PUT /api/v1/merchants/:id
 * @access  Public (should be Private with admin auth in production)
 */
const updateMerchant = async (req, res) => {
    try {
        const {
            businessName,
            phoneNumber,
            businessType,
            streetAddress,
            city,
            state,
            contactPersonName,
            contactDesignation,
            email,
            password,
        } = req.body;

        // Find merchant
        const merchant = await Merchant.findById(req.params.id);

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found',
            });
        }

        if (merchant.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update deleted merchant',
            });
        }

        // Validate required fields
        if (businessName !== undefined && !businessName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Business name is required',
            });
        }

        if (businessType !== undefined && businessType && !['Shop', 'Vendor', 'Restaurant', 'Other'].includes(businessType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid business type. Must be Shop, Vendor, Restaurant, or Other',
            });
        }

        // Update user email and password if provided
        if (email !== undefined || password !== undefined) {
            const User = require('../models/User');
            const user = await User.findById(merchant.userId).select('+password');

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
                merchant.businessEmail = email.toLowerCase().trim();
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
        if (businessName !== undefined) merchant.businessName = businessName.trim();
        if (phoneNumber !== undefined) merchant.phoneNumber = phoneNumber.trim();
        if (businessType !== undefined) merchant.businessType = businessType;
        if (streetAddress !== undefined) merchant.streetAddress = streetAddress.trim();
        if (city !== undefined) merchant.city = city.trim();
        if (state !== undefined) merchant.state = state.trim();
        if (contactPersonName !== undefined) merchant.contactPersonName = contactPersonName.trim();
        if (contactDesignation !== undefined) merchant.contactDesignation = contactDesignation.trim();

        await merchant.save();

        // Populate user data for response
        await merchant.populate('userId', 'email isVerified isActive');

        res.status(200).json({
            success: true,
            message: 'Merchant updated successfully',
            data: {
                id: merchant._id.toString(),
                businessName: merchant.businessName,
                businessEmail: merchant.businessEmail || (merchant.userId && merchant.userId.email) || '',
                phoneNumber: merchant.phoneNumber,
                businessType: merchant.businessType,
                streetAddress: merchant.streetAddress,
                city: merchant.city,
                state: merchant.state,
                contactPersonName: merchant.contactPersonName,
                contactDesignation: merchant.contactDesignation,
            },
        });
    } catch (error) {
        console.error('Update merchant error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating merchant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Soft delete merchant
 * @route   DELETE /api/v1/merchants/:id
 * @access  Public (should be Private with admin auth in production)
 */
const deleteMerchant = async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.params.id);

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found',
            });
        }

        if (merchant.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Merchant is already deleted',
            });
        }

        // Soft delete: mark as deleted
        merchant.isDeleted = true;
        merchant.deletedAt = new Date();
        await merchant.save();

        res.status(200).json({
            success: true,
            message: 'Merchant deleted successfully',
            data: {
                id: merchant._id,
                deletedAt: merchant.deletedAt,
            },
        });
    } catch (error) {
        console.error('Delete merchant error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting merchant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get all applications received for jobs posted by this merchant
 * @route   GET /api/v1/merchants/applications/received
 * @access  Private - Merchant role only
 */
const getReceivedApplications = async (req, res) => {
    try {
        // Double-check: Ensure user has merchant role
        if (!req.user || req.user.role !== 'merchant') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only merchants can access this resource.',
            });
        }

        // Find merchant profile for the authenticated user
        const merchant = await Merchant.findOne({ userId: req.user._id });

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant profile not found.',
            });
        }

        // Find all jobs created by this merchant
        const Job = require('../models/Job'); // Import here to avoid circular dependency issues if any
        const jobs = await Job.find({ merchantId: merchant._id, isDeleted: false }).select('_id');

        const jobIds = jobs.map(job => job._id);

        if (jobIds.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
                message: 'No jobs posted by this merchant.',
            });
        }

        // Find all applications for these jobs
        const JobApplication = require('../models/JobApplication');
        const applications = await JobApplication.find({ jobId: { $in: jobIds } })
            .populate('jobId', 'title location salaryRange category status')
            .populate('homelessId', 'fullName skillset contactPhone contactEmail profilePicture')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications,
            
            message: 'Received applications fetched successfully',
        });

    } catch (error) {
        console.error('Get received applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching applications',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
    getAllMerchants,
    registerMerchant,
    getMerchantById,
    getMyMerchant,
    updateMerchant,
    deleteMerchant,
    getReceivedApplications,
}