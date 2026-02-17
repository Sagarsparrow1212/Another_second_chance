const Organization = require('../models/Organization');
// Note: Merchant model is exported as "Mechant" (typo in model file)
const Merchant = require('../models/Merchant');
const Donor = require('../models/Donor');
const Homeless = require('../models/Homeless');
const Job = require('../models/Job');
const ActivityLog = require('../models/ActivityLog');
const Donation = require('../models/Donation');
const User = require('../models/User');

/**
 * @desc    Get dashboard statistics (counts of all user types)
 * @route   GET /api/v1/dashboard/stats
 * @access  Public (should be Private with admin auth in production)
 */
const getDashboardStats = async (req, res) => {
    try {
        // Count all non-deleted records for each entity
        const [organizationsCount, merchantsCount, donorsCount, homelessCount] = await Promise.all([
            Organization.countDocuments({ isDeleted: false }),
            Merchant.countDocuments({ isDeleted: false }),
            Donor.countDocuments({ isDeleted: false }),
            Homeless.countDocuments({ isDeleted: false }),
        ]);

        res.status(200).json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: {
                organizations: organizationsCount,
                merchants: merchantsCount,
                donors: donorsCount,
                homeless: homelessCount,
            },
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get dashboard data for homeless users
 * @route   GET /api/v1/dashboard/homeless
 * @access  Private - Homeless users only
 */
const getHomelessDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get homeless user profile
        const homelessUser = await Homeless.findOne({ userId, isDeleted: false });
        if (!homelessUser) {
            return res.status(404).json({
                success: false,
                message: 'Homeless user profile not found',
            });
        }

        // Calculate date range for recent jobs (last 3-4 days)
        const now = new Date();
        const fourDaysAgo = new Date(now);
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
        fourDaysAgo.setHours(0, 0, 0, 0);

        // Calculate date range for recent donations (last 30 days)
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. QUICK STATS CARDS
        // Total jobs count (active and pending only)


        // Applied jobs count - track via ActivityLog (jobs that homeless user has viewed/applied to)
        // Looking for activities where homeless user interacted with jobs (viewed job details, applied, etc.)
        const appliedJobsLogs = await ActivityLog.find({
            actorId: userId,
            actorRole: 'homeless',
            $or: [
                { section: 'Job Management', targetType: 'Job' },
                { title: { $regex: /job|apply|application/i } },
                { description: { $regex: /job|apply|application/i } }
            ],
            actionType: { $in: ['READ', 'CREATE', 'UPDATE'] },
            createdAt: { $gte: thirtyDaysAgo }
        }).distinct('targetId');

        const appliedJobsCount = appliedJobsLogs.length;

        // Jobs matching user skills (if homeless user has skills)
        let matchingJobsCount = 0;
        if (homelessUser.skillset && homelessUser.skillset.length > 0) {
            const skillsRegex = new RegExp(homelessUser.skillset.join('|'), 'i');
            matchingJobsCount = await Job.countDocuments({
                isDeleted: false,
                status: { $in: ['active', 'pending'] },
                $or: [
                    { title: { $regex: skillsRegex } },
                    { description: { $regex: skillsRegex } },
                    { category: { $regex: skillsRegex } }
                ]
            });
        }

        // Total donations count for this homeless user (sum of all donations made to them)
        const totalDonationsResult = await Donation.aggregate([
            {
                $match: {
                    homelessId: homelessUser._id,
                    isDeleted: false,
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ['$homelessAmount', 0] } },
                    count: { $sum: 1 }
                }
            }
        ]);
        const totalDonations = totalDonationsResult.length > 0 ? totalDonationsResult[0].total : 0;
        const totalDonationsCount = totalDonationsResult.length > 0 ? totalDonationsResult[0].count : 0;

        // Recent donations count (donations made to this homeless user in last 30 days)
        const recentDonationsCount = await Donation.countDocuments({
            homelessId: homelessUser._id,
            isDeleted: false,
            status: 'Completed',
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Additional stats
        const activeJobsCount = await Job.countDocuments({
            isDeleted: false,
            status: 'active'
        });

        // 2. RECENT JOBS (3-4 jobs from last 3-4 days only)
        const recentJobs = await Job.find({
            isDeleted: false,
            status: { $in: ['active', 'pending'] },
            createdAt: { $gte: fourDaysAgo }
        })
            .populate('merchantId', 'businessName')
            .populate('organizationId', 'orgName')
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title description category salaryRange location status createdAt merchantId organizationId');

        // Format recent jobs with proper time calculation for each job
        const formattedRecentJobs = recentJobs.map(job => {
            // Calculate time difference for THIS specific job
            const jobCreatedAt = new Date(job.createdAt);
            const diffMs = now - jobCreatedAt;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            // Format time ago string
            let timeAgo;
            if (diffSeconds < 60) {
                timeAgo = 'just now';
            } else if (diffMinutes < 60) {
                timeAgo = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else {
                timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            }

            return {
                id: job._id,
                title: job.title,
                description: job.description,
                category: job.category,
                salaryRange: job.salaryRange,
                location: job.location,
                status: job.status,
                postedBy: job.merchantId ? {
                    type: 'merchant',
                    name: job.merchantId.businessName
                } : job.organizationId ? {
                    type: 'organization',
                    name: job.organizationId.orgName
                } : null,
                createdAt: job.createdAt,
                timeAgo: timeAgo
            };
        });

        // 3. RECENT DONATIONS HISTORY
        // Get recent donations made to this homeless user (last 3-4 donations)
        const recentDonations = await Donation.find({
            homelessId: homelessUser._id,
            isDeleted: false,
            status: 'Completed'
        })
            .populate('donorId', 'donorFullName donorEmail donorPhoneNumber')
            .populate('organizationId', 'orgName')
            .sort({ createdAt: -1 })
            .limit(4)
            .select('donationId donationType amount netAmount homelessAmount currency description status createdAt donorId organizationId');

        // Format recent donations
        const formattedRecentDonations = recentDonations.map(donation => {
            const donationCreatedAt = new Date(donation.createdAt);
            const diffMs = now - donationCreatedAt;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffMs / (1000 * 60));

            let timeAgo;
            if (diffMinutes < 60) {
                timeAgo = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else {
                timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            }

            // Use homelessAmount if available (since this is homeless dashboard)
            const displayAmount = (donation.homelessAmount !== undefined && donation.homelessAmount !== null)
                ? donation.homelessAmount
                : (donation.status === 'Completed' ? 0 : donation.amount);

            return {
                id: donation._id,
                donationId: donation.donationId,
                title: donation.donationType === 'Money'
                    ? `$${displayAmount?.toLocaleString() || 0} ${donation.currency || 'USD'} Donation`
                    : `${donation.donationType} Donation`,
                description: donation.description || `Received ${donation.donationType.toLowerCase()} donation`,
                donor: donation.donorId?.donorEmail || 'Anonymous',
                donorName: donation.donorId?.donorFullName || 'Anonymous',
                amount: donation.donationType === 'Money' ? displayAmount : null,
                originalAmount: donation.amount, // Keep original amount for reference if needed
                currency: donation.currency || 'USD',
                type: donation.donationType,
                status: donation.status,
                organization: donation.organizationId?.orgName || null,
                createdAt: donation.createdAt,
                daysAgo: diffDays,
                timeAgo: timeAgo
            };
        });

        // 4. ADDITIONAL INSIGHTS
        // Jobs by category breakdown
        const jobsByCategory = await Job.aggregate([
            {
                $match: {
                    isDeleted: false,
                    status: { $in: ['active', 'pending'] }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        // Jobs by status breakdown
        const jobsByStatus = await Job.aggregate([
            {
                $match: {
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Build quick stats object
        const quickStats = {

            appliedJobs: {
                title: 'Applied Jobs',
                value: appliedJobsCount,
                description: 'Jobs you have interacted with',
                icon: 'check-circle'
            },
            totalDonations: {
                title: 'Total Donations',
                value: totalDonations,
                description: `$${totalDonations.toLocaleString()} received`,
                icon: 'heart-handshake',
                formatted: `$${totalDonations.toLocaleString()}`
            },
            totalDonationsCount: {
                title: 'Donations Received',
                value: totalDonationsCount,
                description: 'Total number of donations',
                icon: 'gift'
            },
            recentDonations: {
                title: 'Recent Donations',
                value: recentDonationsCount,
                description: 'Donations in last 30 days',
                icon: 'trending-up'
            },
            activeJobs: {
                title: 'Active Jobs',
                value: activeJobsCount,
                description: 'Currently active job postings',
                icon: 'briefcase-check'
            },


        };

        // Add matching jobs if user has skills and matching jobs exist
        if (matchingJobsCount > 0) {
            quickStats.matchingJobs = {
                title: 'Matching Jobs',
                value: matchingJobsCount,
                description: 'Jobs matching your skills',
                icon: 'target'
            };
        }

        // Response data
        res.status(200).json({
            success: true,
            message: 'Homeless dashboard data retrieved successfully',
            data: {
                quickStats,
                recentJobs: formattedRecentJobs,
                recentDonations: formattedRecentDonations,
                insights: {
                    jobsByCategory: jobsByCategory.map(item => ({
                        category: item._id,
                        count: item.count
                    })),
                    jobsByStatus: jobsByStatus.map(item => ({
                        status: item._id,
                        count: item.count
                    }))
                },
                userInfo: {
                    homelessId: homelessUser._id,
                    fullName: homelessUser.fullName,
                    organizationId: homelessUser.organizationId
                }
            }
        });
    } catch (error) {
        console.error('Get homeless dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
    getDashboardStats,
    getHomelessDashboard,
};

