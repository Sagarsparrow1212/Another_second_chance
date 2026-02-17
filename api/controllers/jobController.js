const Job = require('../models/Job');
const Merchant = require('../models/Merchant');
const JobApplication = require('../models/JobApplication'); // Added
const Homeless = require('../models/Homeless'); // Added
const mongoose = require('mongoose');

/**
 * @desc    Apply for a job
 * @route   POST /api/v1/jobs/:jobId/apply
 * @access  Private (Homeless only)
 */
const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Verify that the user is a homeless person
        // req.user is set by the auth middleware
        // Typically role check is done in middleware, but we double check or fetch the Homeless profile here

        // Find the Homeless profile associated with this user
        // Assuming req.user._id is the User model ID
        const homelessProfile = await Homeless.findOne({ userId: req.user._id });

        if (!homelessProfile) {
            return res.status(404).json({
                success: false,
                message: 'Homeless profile not found for this user',
            });
        }

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Job is not active',
            });
        }

        if (job.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Job has been deleted',
            });
        }

        // Check if already applied
        const existingApplication = await JobApplication.findOne({
            jobId: job._id,
            homelessId: homelessProfile._id
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job',
            });
        }

        // Create application
        const application = await JobApplication.create({
            jobId: job._id,
            homelessId: homelessProfile._id,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });

    } catch (error) {
        console.error('Apply for job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while applying for job',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get job applications for the logged-in homeless user
 * @route   GET /api/v1/jobs/applications/me
 * @access  Private (Homeless only)
 */
const getHomelessApplications = async (req, res) => {
    try {
        // Find the Homeless profile associated with this user
        const homelessProfile = await Homeless.findOne({ userId: req.user._id });

        if (!homelessProfile) {
            return res.status(404).json({
                success: false,
                message: 'Homeless profile not found for this user',
            });
        }

        // Find applications for this homeless person
        const applications = await JobApplication.find({ homelessId: homelessProfile._id })
            .populate({
                path: 'jobId',
                select: 'title description company location salaryRange status',
                populate: {
                    path: 'merchantId',
                    select: 'businessName'
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Applications retrieved successfully',
            data: applications
        });

    } catch (error) {
        console.error('Get homeless applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching applications',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Create a new job for a merchant
 * @route   POST /api/v1/merchants/:merchantId/jobs
 * @access  Public (should be Private with merchant auth in production)
 */
const createJob = async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { title, description, category, salaryRange, location, status } = req.body;

        // Log for debugging
        console.log(`[Create Job] User: ${req.user?.email}, Role: ${req.user?.role}, MerchantId: ${merchantId}`);

        // Validate required fields
        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and category are required',
            });
        }

        if (!salaryRange || typeof salaryRange.min !== 'number' || typeof salaryRange.max !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Salary range with min and max is required',
            });
        }

        if (salaryRange.min < 0 || salaryRange.max < 0) {
            return res.status(400).json({
                success: false,
                message: 'Salary values must be non-negative',
            });
        }

        if (salaryRange.min > salaryRange.max) {
            return res.status(400).json({
                success: false,
                message: 'Minimum salary cannot be greater than maximum salary',
            });
        }

        if (!location || !location.address) {
            return res.status(400).json({
                success: false,
                message: 'Location address is required',
            });
        }

        // Check if merchant exists
        const merchant = await Merchant.findById(merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found',
            });
        }

        if (merchant.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create job for deleted merchant',
            });
        }

        // Validate status if provided
        if (status && !['active', 'closed', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active, closed, or pending',
            });
        }

        // Create job
        const jobData = {
            merchantId,
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            salaryRange: {
                min: salaryRange.min,
                max: salaryRange.max,
            },
            location: {
                address: location.address.trim(),
                lat: location.lat || null,
                lng: location.lng || null,
            },
            status: status || 'active',
        };

        // If created by an organization user, set organizationId and createdByUserId
        if (req.user && req.user.role === 'organization') {
            const Organization = require('../models/Organization');
            const org = await Organization.findOne({ userId: req.user._id, isDeleted: false });
            if (org) {
                jobData.organizationId = org._id;
            }
            jobData.createdByUserId = req.user._id;
        } else if (req.user && req.user.role === 'merchant') {
            jobData.createdByUserId = req.user._id;
        }

        const job = await Job.create(jobData);

        // Add job to merchant's jobs array
        merchant.jobs = merchant.jobs || [];
        merchant.jobs.push(job._id);
        await merchant.save();

        // NOTIFICATION: Notify all homeless users about the new job
        // This is non-blocking to ensure fast response to the merchant
        process.nextTick(async () => {
            try {
                const User = require('../models/User');
                const NotificationService = require('../services/notificationService');

                // 1. Find all active homeless users
                const homelessUsers = await User.find({
                    role: 'homeless',
                    isActive: true,
                    fcmTokens: { $exists: true, $not: { $size: 0 } } // Only users with tokens
                }).select('fcmTokens');

                if (homelessUsers.length > 0) {
                    // 2. Collect all tokens (flatten array)
                    const allTokens = homelessUsers.reduce((tokens, user) => {
                        if (user.fcmTokens && user.fcmTokens.length > 0) {
                            return tokens.concat(user.fcmTokens);
                        }
                        return tokens;
                    }, []);

                    // 3. Send multicast notification
                    if (allTokens.length > 0) {
                        const notificationTitle = 'New Job Alert!';
                        const notificationBody = `A new job "${job.title}" is available in ${job.location.address}. Apply now!`;

                        // Remove duplicates from tokens array
                        const uniqueTokens = [...new Set(allTokens)];
                        console.log(`[Job Notification] Sending to ${uniqueTokens.length} devices...`);

                        await NotificationService.sendToMulticast(
                            uniqueTokens,
                            notificationTitle,
                            notificationBody,
                            {
                                type: 'new_job',
                                jobId: job._id.toString()
                            }
                        );
                    }
                }
            } catch (notifyError) {
                console.error('[Job Notification] Error sending notifications:', notifyError);
                // Don't fail the request if notification fails
            }
        });

        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            data: job,
        });
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating job',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get all jobs for a merchant
 * @route   GET /api/v1/merchants/:merchantId/jobs
 * @access  Public (should be Private with merchant auth in production)
 */
const getMerchantJobs = async (req, res) => {
    try {
        const { merchantId } = req.params;

        // Check if merchant exists
        const merchant = await Merchant.findById(merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found',
            });
        }

        // Get all non-deleted jobs for this merchant
        const jobs = await Job.find({
            merchantId,
            isDeleted: false,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Jobs retrieved successfully',
            data: {
                jobs,
                count: jobs.length,
            },
        });
    } catch (error) {
        console.error('Get merchant jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get all jobs (across all merchants)
 * @route   GET /api/v1/jobs
 * @access  Public (should be Private with admin auth in production)
 */
const getAllJobs = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = { isDeleted: false };

        if (status && ['active', 'closed', 'pending'].includes(status)) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }

        // Get total count for pagination
        const total = await Job.countDocuments(query);

        // Get jobs with merchant information
        const jobs = await Job.find(query)
            .populate('merchantId', 'businessName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // i want to put delay of 1 second before sending the response


        res.status(200).json({
            success: true,
            message: 'Jobs retrieved successfully',
            data: {
                jobs,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Get all jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Update a job
 * @route   PATCH /api/v1/jobs/:jobId
 * @access  Public (should be Private with merchant auth in production)
 */
const updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { title, description, category, salaryRange, location, status } = req.body;

        // Find job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update deleted job',
            });
        }

        // Validate salary range if provided
        if (salaryRange) {
            if (typeof salaryRange.min !== 'undefined' && typeof salaryRange.min !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Salary min must be a number',
                });
            }
            if (typeof salaryRange.max !== 'undefined' && typeof salaryRange.max !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Salary max must be a number',
                });
            }
            if (salaryRange.min !== undefined && salaryRange.min < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Salary min must be non-negative',
                });
            }
            if (salaryRange.max !== undefined && salaryRange.max < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Salary max must be non-negative',
                });
            }
            const finalMin = salaryRange.min !== undefined ? salaryRange.min : job.salaryRange.min;
            const finalMax = salaryRange.max !== undefined ? salaryRange.max : job.salaryRange.max;
            if (finalMin > finalMax) {
                return res.status(400).json({
                    success: false,
                    message: 'Minimum salary cannot be greater than maximum salary',
                });
            }
        }

        // Validate status if provided
        if (status && !['active', 'closed', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active, closed, or pending',
            });
        }

        // Update fields (only update provided fields)
        if (title !== undefined) job.title = title.trim();
        if (description !== undefined) job.description = description.trim();
        if (category !== undefined) job.category = category.trim();
        if (salaryRange) {
            if (salaryRange.min !== undefined) job.salaryRange.min = salaryRange.min;
            if (salaryRange.max !== undefined) job.salaryRange.max = salaryRange.max;
        }
        if (location) {
            if (location.address !== undefined) job.location.address = location.address.trim();
            if (location.lat !== undefined) job.location.lat = location.lat;
            if (location.lng !== undefined) job.location.lng = location.lng;
        }
        if (status !== undefined) job.status = status;

        await job.save();

        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            data: job,
        });
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating job',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Delete a job (soft delete)
 * @route   DELETE /api/v1/jobs/:jobId
 * @access  Public (should be Private with merchant auth in production)
 */
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Find job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Job is already deleted',
            });
        }

        // Soft delete
        job.isDeleted = true;
        job.deletedAt = new Date();
        await job.save();

        // Remove job from merchant's jobs array
        const merchant = await Merchant.findById(job.merchantId);
        if (merchant) {
            merchant.jobs = merchant.jobs.filter(
                (id) => id.toString() !== jobId
            );
            await merchant.save();
        }

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully',
        });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting job',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get single job by ID
 * @route   GET /api/v1/jobs/:jobId
 * @access  Public
 */
const getJobById = async (req, res) => {
    try {
        let { jobId } = req.params;

        if (typeof jobId === 'string') jobId = jobId.trim();

        // Validate ObjectId early to avoid Mongoose CastError
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job ID',
            });
        }

        // Find job with merchant information
        const job = await Job.findOne({
            _id: jobId,
            isDeleted: false,
        })
            .populate('merchantId', 'businessName email contactPhone')
            .lean();

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Job retrieved successfully',
            data: job,
        });
    } catch (error) {
        console.error('Get job by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching job',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
    createJob,
    getMerchantJobs,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    applyForJob,
    getHomelessApplications,
};

