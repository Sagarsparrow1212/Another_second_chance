const Organization = require('../models/Organization');
const User = require('../models/User');
const Request = require('../models/Request');
const Rejection = require('../models/Rejection');
const Homeless = require('../models/Homeless');
const Job = require('../models/Job');
const Merchant = require('../models/Merchant');
const Donation = require('../models/Donation');
const generateToken = require('../services/generateToken');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

/**
 * @desc    Get all organizations
 * @route   GET /api/v1/organizations
 * @access  Public (or Private if you want to add auth later)
 */
const getAllOrganizations = async (req, res) => {
  try {
    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    const searchQuery = search
      ? {
        $or: [
          { orgName: { $regex: search, $options: 'i' } },
          { contactEmail: { $regex: search, $options: 'i' } },
          { contactPhone: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { state: { $regex: search, $options: 'i' } },
        ],
        isDeleted: false, // Exclude deleted records
      }
      : { isDeleted: false }; // Exclude deleted records

    // Get organizations with user details and latest request
    const organizations = await Organization.find(searchQuery)
      .populate('userId', 'email isVerified isActive')
      .populate('latestRequestId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Organization.countDocuments(searchQuery);

    // Get homeless count for each organization
    const organizationIds = organizations.map(org => org._id);
    const homelessCounts = await Homeless.aggregate([
      { $match: { organizationId: { $in: organizationIds }, isDeleted: false } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } }
    ]);

    // Create a map for quick lookup
    const homelessCountMap = {};
    homelessCounts.forEach(item => {
      homelessCountMap[item._id.toString()] = item.count;
    });

    // Format the response
    const formattedOrganizations = organizations.map((org) => {
      // Check if the latest request is resubmitted (status: Pending and resubmitted: true)
      const latestRequest = org.latestRequestId;
      const isResubmitted = latestRequest &&
        typeof latestRequest === 'object' &&
        latestRequest.status === 'Pending' &&
        latestRequest.resubmitted === true;

      // Get homeless count for this organization
      const homelessCount = homelessCountMap[org._id.toString()] || 0;

      return {
        id: org._id.toString(),
        name: org.orgName,
        email: org.email || (org.userId && org.userId.email) || '', // Primary email field
        emergencyContactEmail: org.emergencyContactEmail || '',
        orgType: org.orgType,
        streetAddress: org.streetAddress,
        city: org.city,
        state: org.state,
        zipCode: org.zipCode,
        homelessCount: homelessCount,
        country: org.country,
        contactPerson: org.contactPerson || '',
        contactPhone: org.contactPhone || '',
        currentStatus: isResubmitted ? 'Resubmitted' : (org.currentStatus || 'Pending'),
        latestRequestId: org.latestRequestId ? org.latestRequestId._id.toString() : null,
        latestRejectionId: org.latestRejectionId ? org.latestRejectionId.toString() : null,
        // Legacy fields for backward compatibility
        verified: org.verified || (org.currentStatus === 'Approved'),
        resubmitted: org.resubmitted || false,
        isResubmitted: isResubmitted, // New field to indicate resubmission
        createdAt: org.createdAt ? new Date(org.createdAt).toISOString().split('T')[0] : '',
        userEmail: org.userId && org.userId.email ? org.userId.email : '',
        isUserVerified: org.userId && org.userId.isVerified ? org.userId.isVerified : false,
        isUserActive: org.userId && org.userId.isActive !== undefined ? org.userId.isActive : true,
        logo: org.logo || '', // Organization logo

      };
    });

    res.status(200).json({
      success: true,
      data: {
        organizations: formattedOrganizations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
      message: 'Organizations fetched successfully',
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching organizations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get single organization by ID with activity timeline
 * @route   GET /api/v1/organizations/:id
 * @access  Public (or Private if you want to add auth later)
 */
const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('userId', 'email isVerified isActive')
      .lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Get all requests for this organization (activity timeline)
    const requests = await Request.find({ organizationId: organization._id })
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .lean();

    // Get all rejections for this organization
    const rejections = await Rejection.find({ organizationId: organization._id })
      .sort({ rejectedAt: -1 }) // Sort by rejection date (newest first)
      .lean();

    // Build activity timeline
    const activities = [];

    // Add first submission (organization creation)
    if (organization.createdAt) {
      activities.push({
        type: 'Initial Submission',
        date: organization.createdAt,
        description: 'Organization registered and submitted for review',
      });
    }

    // Add all requests and their associated rejections
    for (const request of requests) {
      if (request.status === 'Rejected' && request.rejectionId) {
        // Find the rejection for this request
        const rejection = rejections.find(
          (r) => r._id.toString() === request.rejectionId.toString()
        );

        if (rejection) {
          activities.push({
            type: 'Rejected',
            date: rejection.rejectedAt || request.updatedAt,
            description: rejection.reason,
            rejectedBy: rejection.rejectedBy,
            requestId: request.requestId,
          });
        }
      } else if (request.status === 'Approved') {
        activities.push({
          type: 'Approved',
          date: request.updatedAt || request.createdAt,
          description: 'Organization approved',
          requestId: request.requestId,
        });
      } else if (request.status === 'Pending' && request.resubmitted) {
        activities.push({
          type: 'Resubmitted',
          date: request.createdAt,
          description: 'Organization resubmitted for review',
          requestId: request.requestId,
        });
      }
    }

    // Sort activities by date (newest first - descending order)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Check if user has a password (password field exists and is not empty)
    const User = require('../models/User');
    const user = await User.findById(organization.userId).select('+password').lean();
    const hasPassword = user && user.password && user.password.length > 0;

    const formattedOrg = {
      id: organization._id.toString(),
      name: organization.orgName,
      email: organization.email || (organization.userId && organization.userId.email) || '', // Primary email field
      emergencyContactEmail: organization.emergencyContactEmail || '',
      orgType: organization.orgType,
      streetAddress: organization.streetAddress,
      city: organization.city,
      state: organization.state,
      zipCode: organization.zipCode,
      country: organization.country,
      contactPerson: organization.contactPerson || '',
      contactPhone: organization.contactPhone || '',
      currentStatus: organization.currentStatus || 'Pending',
      verified: organization.verified || (organization.currentStatus === 'Approved'),
      resubmitted: organization.resubmitted || false,
      createdAt: organization.createdAt ? new Date(organization.createdAt).toISOString().split('T')[0] : '',
      userEmail: organization.userId && organization.userId.email ? organization.userId.email : '',
      isUserVerified: organization.userId && organization.userId.isVerified ? organization.userId.isVerified : false,
      isUserActive: organization.userId && organization.userId.isActive !== undefined ? organization.userId.isActive : true,
      hasPassword: hasPassword, // Flag to indicate password exists
      logo: organization.logo || '', // Organization logo
      documents: organization.documents || [],
      photos: organization.photos || [],
      activities: activities, // Activity timeline
    };

    res.status(200).json({
      success: true,
      data: formattedOrg,
      message: 'Organization fetched successfully',
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching organization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get organization by authenticated user (for organization users to get their own org)
 * @route   GET /api/v1/organizations/me
 * @access  Private - Organization role only
 */
const getMyOrganization = async (req, res) => {
  try {
    // Double-check: Ensure user has organization role (extra security layer)
    if (!req.user || req.user.role !== 'organization') {
      return res.status(403).json({
        success: false,
        message: `Only specific roles can access it.`,
      });
    }

    // Find organization by userId from authenticated user
    const organization = await Organization.findOne({
      userId: req.user._id,
      isDeleted: false,
    })
      .populate('userId', 'email isVerified isActive')
      .lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found for this user',
      });
    }

    // Get all requests for this organization (activity timeline)
    const requests = await Request.find({ organizationId: organization._id })
      .sort({ createdAt: -1 })
      .lean();

    // Get all rejections for this organization
    const rejections = await Rejection.find({ organizationId: organization._id })
      .sort({ rejectedAt: -1 })
      .lean();

    // Build activity timeline (same logic as getOrganizationById)
    const activities = [];

    if (organization.createdAt) {
      activities.push({
        type: 'First Submit',
        date: organization.createdAt,
        description: 'Organization registered and submitted for review',
      });
    }

    for (const request of requests) {
      if (request.status === 'Rejected' && request.rejectionId) {
        const rejection = rejections.find(
          (r) => r._id.toString() === request.rejectionId.toString()
        );

        if (rejection) {
          activities.push({
            type: 'Rejected',
            date: rejection.rejectedAt || request.updatedAt,
            description: rejection.reason,
            rejectedBy: rejection.rejectedBy,
            requestId: request.requestId,
          });
        }
      } else if (request.status === 'Approved') {
        activities.push({
          type: 'Approved',
          date: request.updatedAt || request.createdAt,
          description: 'Organization approved',
          requestId: request.requestId,
        });
      } else if (request.status === 'Pending' && request.resubmitted) {
        activities.push({
          type: 'Resubmitted',
          date: request.createdAt,
          description: 'Organization resubmitted for review',
          requestId: request.requestId,
        });
      }
    }

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get rejection data if organization is rejected
    let rejectionData = null;
    const isUserVerified = organization.userId && organization.userId.isVerified ? organization.userId.isVerified : false;

    if (
      organization.currentStatus === 'Rejected' &&
      !isUserVerified &&
      organization.latestRejectionId
    ) {
      // Find the latest rejection
      const latestRejection = await Rejection.findById(organization.latestRejectionId).lean();

      if (latestRejection) {
        rejectionData = {
          reason: latestRejection.reason || '',
          rejectedAt: latestRejection.rejectedAt
            ? new Date(latestRejection.rejectedAt).toISOString()
            : null,
        };
      }
    }

    const formattedOrg = {
      id: organization._id.toString(),
      name: organization.orgName,
      email: organization.email || (organization.userId && organization.userId.email) || '',
      emergencyContactEmail: organization.emergencyContactEmail || '',
      orgType: organization.orgType,
      streetAddress: organization.streetAddress,
      city: organization.city,
      state: organization.state,
      zipCode: organization.zipCode,
      country: organization.country,
      contactPerson: organization.contactPerson || '',
      contactPhone: organization.contactPhone || '',
      currentStatus: organization.currentStatus || 'Pending',
      verified: organization.verified || (organization.currentStatus === 'Approved'),
      resubmitted: organization.resubmitted || false,
      createdAt: organization.createdAt ? new Date(organization.createdAt).toISOString().split('T')[0] : '',
      userEmail: organization.userId && organization.userId.email ? organization.userId.email : '',
      isUserVerified: isUserVerified,
      isUserActive: organization.userId && organization.userId.isActive !== undefined ? organization.userId.isActive : true,
      logo: organization.logo || '', // Organization logo
      documents: organization.documents || [],
      photos: organization.photos || [],
      activities: activities,
      // Add rejection data if available
      ...(rejectionData && { rejection: rejectionData }),
      /**
       * rejection: {
       *   reason: string,
       *   rejectedAt: string,
       * }
       * 
       */
    };

    res.status(200).json({
      success: true,
      data: formattedOrg,
      message: 'Organization fetched successfully',
    });
  } catch (error) {
    console.error('Get my organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching organization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Approve organization
 * @route   PUT /api/v1/organizations/:id/approve
 * @access  Public (should be Private with admin auth in production)
 */
const approveOrganization = async (req, res) => {
  try {
    // Find organization first
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Get the previous request (if exists) to link to
    const previousRequestId = organization.latestRequestId;

    // Create NEW request document for approval (don't update old one)
    const requestId = `REQ${Date.now()}`;
    const newRequest = await Request.create({
      requestId,
      organizationId: organization._id,
      userId: organization.userId,
      status: 'Approved',
      resubmitted: false,
      previousRequestId: previousRequestId || null,
      rejectionId: null,
    });

    // Update organization
    organization.currentStatus = 'Approved';
    organization.latestRequestId = newRequest._id;
    organization.verified = true; // Legacy field
    organization.resubmitted = false;
    // Keep latestRejectionId for history (optional)
    await organization.save();

    // Update user account - set isVerified to true and isActive to true
    const user = await User.findById(organization.userId);
    if (user) {
      user.isVerified = true;
      user.isActive = true;
      await user.save();
      console.log(`User account verified and activated for organization: ${organization.orgName}`);
    }

    // Populate user data for response
    await organization.populate('userId', 'email isVerified isActive');

    // Send approval email to organization
    const recipientEmail = organization.email || (organization.userId && organization.userId.email);
    if (recipientEmail) {
      try {
        const emailResult = await sendApprovalEmail(
          recipientEmail,
          organization.orgName,
          newRequest.requestId
        );
        if (emailResult.success) {
          console.log(`Approval email sent successfully to ${recipientEmail}`);
        } else {
          console.warn(`Failed to send approval email to ${recipientEmail}:`, emailResult.error || emailResult.message);
        }
      } catch (emailError) {
        // Don't fail the approval if email fails, just log it
        console.error('Error sending approval email (non-blocking):', emailError);
      }
    } else {
      console.warn('No email address found for organization. Skipping approval email.');
    }

    res.status(200).json({
      success: true,
      data: {
        id: organization._id.toString(),
        name: organization.orgName,
        currentStatus: organization.currentStatus,
        requestId: newRequest.requestId,
      },
      message: 'Organization approved successfully',
    });
  } catch (error) {
    console.error('Approve organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving organization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Reject organization
 * @route   PUT /api/v1/organizations/:id/reject
 * @access  Public (should be Private with admin auth in production)
 */
const rejectOrganization = async (req, res) => {
  try {
    const { rejectionMessage } = req.body;

    // Validate rejection message
    if (!rejectionMessage || rejectionMessage.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection message (reason) is required',
      });
    }

    // Find organization first to check if it exists and populate latestRequestId
    const organization = await Organization.findById(req.params.id)
      .populate('latestRequestId');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Get the current/latest request to link as previousRequestId
    // This ensures we maintain the audit trail chain
    const currentRequest = organization.latestRequestId;
    const previousRequestId = currentRequest ? currentRequest._id : null;

    // Check if current request is resubmitted (for logging/validation)
    const isResubmittedRejection = currentRequest &&
      currentRequest.resubmitted === true &&
      currentRequest.status === 'Pending';

    // IMPORTANT: Always create a NEW request document for rejection
    // Never update or overwrite existing requests - this maintains audit trail
    const requestId = `REQ${Date.now()}`;
    const newRequest = await Request.create({
      requestId,
      organizationId: organization._id,
      userId: organization.userId,
      status: 'Rejected',
      resubmitted: false, // New rejection is not a resubmission
      previousRequestId: previousRequestId, // Link to the current request (could be resubmitted or original)
      rejectionId: null, // Will be set after creating rejection
    });

    // Create NEW rejection document (never update existing ones)
    const rejectionId = `REJ${Date.now()}`;
    const rejection = await Rejection.create({
      rejectionId,
      requestId: newRequest._id, // Link to the NEW request
      organizationId: organization._id,
      rejectedBy: req.user?.email || req.user?.id || 'Admin',
      reason: rejectionMessage.trim(),
      rejectedAt: new Date(),
    });

    // Update the new request with rejectionId
    newRequest.rejectionId = rejection._id;
    await newRequest.save();

    // Update organization with the NEW request and rejection references
    // This ensures latestRequestId always points to the most recent request
    organization.currentStatus = 'Rejected';
    organization.latestRequestId = newRequest._id; // Point to NEW request
    organization.latestRejectionId = rejection._id; // Point to NEW rejection
    organization.verified = false; // Legacy field
    organization.resubmitted = false; // Reset resubmitted flag
    await organization.save();

    // Update user account - set isVerified to false (keep isActive true so they can login and resubmit)
    const user = await User.findById(organization.userId);
    if (user) {
      user.isVerified = false;
      // Keep isActive as true so user can still login and resubmit their profile
      await user.save();
      console.log(`User account verification status updated (rejected) for organization: ${organization.orgName}`);
    }

    // Populate user data for response
    await organization.populate('userId', 'email isVerified isActive');

    // Send rejection email to organization
    const recipientEmail = organization.email || (organization.userId && organization.userId.email);
    if (recipientEmail) {
      try {
        const emailResult = await sendRejectionEmail(
          recipientEmail,
          organization.orgName,
          rejectionMessage.trim(),
          newRequest.requestId,
          rejection.rejectionId
        );
        if (emailResult.success) {
          console.log(`Rejection email sent successfully to ${recipientEmail}`);
        } else {
          console.warn(`Failed to send rejection email to ${recipientEmail}:`, emailResult.error || emailResult.message);
        }
      } catch (emailError) {
        // Don't fail the rejection if email fails, just log it
        console.error('Error sending rejection email (non-blocking):', emailError);
      }
    } else {
      console.warn('No email address found for organization. Skipping rejection email.');
    }

    res.status(200).json({
      success: true,
      data: {
        id: organization._id.toString(),
        name: organization.orgName,
        currentStatus: organization.currentStatus,
        requestId: newRequest.requestId,
        rejectionId: rejection.rejectionId,
      },
      message: 'Organization rejected successfully',
    });
  } catch (error) {
    console.error('Reject organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting organization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Request re-review for rejected organization
 * @route   PUT /api/v1/organizations/:id/request-review
 * @access  Public (should be Private with organization auth in production)
 */
const requestReview = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Only allow re-review request if organization is rejected (not approved)
    if (organization.currentStatus === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Organization is already approved. Cannot request re-review.',
      });
    }

    // Update status to Pending (for re-review)
    organization.currentStatus = 'Pending';
    await organization.save();

    // Populate user data for response
    await organization.populate('userId', 'email isVerified isActive');

    res.status(200).json({
      success: true,
      data: {
        id: organization._id.toString(),
        name: organization.orgName,
        currentStatus: organization.currentStatus,
      },
      message: 'Re-review requested successfully',
    });
  } catch (error) {
    console.error('Request review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while requesting re-review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Mark organization as resubmitted after updating details (from mobile app)
 * @route   PUT /api/v1/organizations/:id/resubmit
 * @access  Public (should be Private with organization auth in production)
 */
const resubmitOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Only allow resubmission if organization is rejected (not approved)
    if (organization.currentStatus === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Organization is already approved. Cannot resubmit.',
      });
    }

    // Get the previous request (if exists)
    const previousRequestId = organization.latestRequestId;

    // Create new request for resubmission
    const requestId = `REQ${Date.now()}`;
    const newRequest = await Request.create({
      requestId,
      organizationId: organization._id,
      userId: organization.userId,
      status: 'Pending',
      resubmitted: true,
      previousRequestId: previousRequestId || null,
      rejectionId: null,
    });

    // Update organization
    organization.currentStatus = 'Pending';
    organization.latestRequestId = newRequest._id;
    organization.resubmitted = true; // Legacy field
    // Keep latestRejectionId for history
    await organization.save();

    // Populate user data for response
    await organization.populate('userId', 'email isVerified isActive');

    res.status(200).json({
      success: true,
      data: {
        id: organization._id.toString(),
        name: organization.orgName,
        currentStatus: organization.currentStatus,
        requestId: newRequest.requestId,
        resubmitted: organization.resubmitted,
      },
      message: 'Organization resubmitted successfully for review',
    });
  } catch (error) {
    console.error('Resubmit organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resubmitting organization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Update organization details
 * @route   PUT /api/v1/organizations/:id
 * @access  Public (should be Private with admin auth in production)
 */
const updateOrganization = async (req, res) => {
  try {
    const {
      orgName,
      orgType,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      contactPerson,
      contactEmail,
      contactPhone,
      email,
      password,
    } = req.body;

    // Find organization
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    if (organization.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update deleted organization',
      });
    }

    // Validate required fields
    if (orgName !== undefined && !orgName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required',
      });
    }

    if (orgType !== undefined && !['NGO', 'Private', 'Govt'].includes(orgType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization type. Must be NGO, Private, or Govt',
      });
    }

    // Update user email and password if provided
    if (email !== undefined || password !== undefined) {
      const User = require('../models/User');
      // Select password field if we need to verify it
      const user = await User.findById(organization.userId).select('+password');

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
        // Also update organization email field
        organization.email = email.toLowerCase().trim();
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

    // Update organization fields (only update provided fields)
    if (orgName !== undefined) organization.orgName = orgName.trim();
    if (orgType !== undefined) organization.orgType = orgType;
    if (streetAddress !== undefined) organization.streetAddress = streetAddress.trim();
    if (city !== undefined) organization.city = city.trim();
    if (state !== undefined) organization.state = state.trim();
    if (zipCode !== undefined) {
      // Validate US ZIP code format (5 digits or 5+4 format)
      const zipCodeRegex = /^\d{5}(-\d{4})?$/;
      if (zipCode.trim() && !zipCodeRegex.test(zipCode.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ZIP code format. Please use 5-digit format (e.g., 10001) or ZIP+4 format (e.g., 10001-1234)',
        });
      }
      organization.zipCode = zipCode.trim();
    }
    if (country !== undefined) organization.country = country.trim();
    if (contactPerson !== undefined) organization.contactPerson = contactPerson.trim();
    if (contactEmail !== undefined) organization.contactEmail = contactEmail.trim();
    if (contactPhone !== undefined) organization.contactPhone = contactPhone.trim();

    // Handle document updates
    // Parse existing documents to keep (sent as JSON string)
    let existingDocuments = [];
    if (req.body.existingDocuments) {
      try {
        existingDocuments = typeof req.body.existingDocuments === 'string'
          ? JSON.parse(req.body.existingDocuments)
          : req.body.existingDocuments;
      } catch (e) {
        console.error('Error parsing existing documents:', e);
      }
    }

    // Handle new document uploads
    let newDocuments = [];
    if (req.files && req.files.documents) {
      let docNames = [];
      if (req.body.documentNames) {
        try {
          docNames = typeof req.body.documentNames === 'string'
            ? JSON.parse(req.body.documentNames)
            : req.body.documentNames;
        } catch (e) {
          console.error('Error parsing document names:', e);
        }
      }

      newDocuments = req.files.documents.map((file, index) => ({
        docName: docNames[index] || file.originalname,
        docUrl: `/uploads/organizations/${file.filename}`,
      }));
    }

    // Combine existing and new documents
    organization.documents = [...existingDocuments, ...newDocuments];

    // Handle photo updates
    // Parse existing photos to keep (sent as JSON string)
    let existingPhotos = [];
    if (req.body.existingPhotos) {
      try {
        existingPhotos = typeof req.body.existingPhotos === 'string'
          ? JSON.parse(req.body.existingPhotos)
          : req.body.existingPhotos;
      } catch (e) {
        console.error('Error parsing existing photos:', e);
      }
    }

    // Handle new photo uploads
    let newPhotos = [];
    if (req.files && req.files.photos) {
      let photoNames = [];
      if (req.body.photoNames) {
        try {
          photoNames = typeof req.body.photoNames === 'string'
            ? JSON.parse(req.body.photoNames)
            : req.body.photoNames;
        } catch (e) {
          console.error('Error parsing photo names:', e);
        }
      }

      newPhotos = req.files.photos.map((file, index) => ({
        photoName: photoNames[index] || file.originalname,
        photoUrl: `/uploads/organizations/${file.filename}`,
      }));
    }

    // Combine existing and new photos
    organization.photos = [...existingPhotos, ...newPhotos];

    // Handle logo update (optional)
    if (req.files && req.files.logo && req.files.logo.length > 0) {
      organization.logo = `/uploads/organizations/${req.files.logo[0].filename}`;
    }

    // Get the previous request (if exists) before updating
    const previousRequestId = organization.latestRequestId;

    // Create a new request for resubmission when organization is updated
    // This creates an audit trail similar to "Initial Submission"
    const requestId = `REQ${Date.now()}`;
    const newRequest = await Request.create({
      requestId,
      organizationId: organization._id,
      userId: organization.userId,
      status: 'Pending',
      resubmitted: true,
      previousRequestId: previousRequestId || null,
      rejectionId: null,
    });

    // Update organization status to Pending and set resubmitted flag
    organization.currentStatus = 'Pending';
    organization.latestRequestId = newRequest._id;
    organization.resubmitted = true; // Legacy field

    await organization.save();

    // Populate user data for response
    await organization.populate('userId', 'email isVerified isActive');

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: {
        id: organization._id.toString(),
        orgName: organization.orgName,
        orgType: organization.orgType,
        email: organization.email || (organization.userId && organization.userId.email) || '',
        streetAddress: organization.streetAddress,
        city: organization.city,
        state: organization.state,
        zipCode: organization.zipCode,
        country: organization.country,
        contactPerson: organization.contactPerson,
        contactEmail: organization.contactEmail,
        contactPhone: organization.contactPhone,
        currentStatus: organization.currentStatus,
      },
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating organization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Soft delete organization
 * @route   DELETE /api/v1/organizations/:id
 * @access  Public (should be Private with admin auth in production)
 */
const deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    if (organization.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Organization is already deleted',
      });
    }

    // Soft delete: mark as deleted
    organization.isDeleted = true;
    organization.deletedAt = new Date();
    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
      data: {
        id: organization._id,
        deletedAt: organization.deletedAt,
      },
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting organization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Register a new organization
 * @route   POST /api/v1/organizations/register
 * @access  Public
 */
const registerOrganization = async (req, res) => {
  try {
    const {
      email,
      password,
      orgName,
      orgType,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      contactPerson,
      emergencyContactEmail,
      contactPhone,
    } = req.body;

    // Validate required fields
    if (!email || !password || !orgName || !orgType || !streetAddress || !city || !state || !zipCode || !country) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, orgName, orgType, streetAddress, city, state, zipCode, country',
      });
    }

    // Validate US ZIP code format (5 digits or 5+4 format)
    const zipCodeRegex = /^\d{5}(-\d{4})?$/;
    if (!zipCodeRegex.test(zipCode.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ZIP code format. Please use 5-digit format (e.g., 10001) or ZIP+4 format (e.g., 10001-1234)',
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

    // Check if organization email already exists in Organization collection
    const existingOrganization = await Organization.findOne({ email: email.toLowerCase() });
    if (existingOrganization) {
      return res.status(400).json({
        success: false,
        message: 'Organization email already registered',
      });
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      role: 'organization',
      isVerified: false,
      isActive: true,
    });

    // Handle file uploads - multer handles file saving
    let documents = [];
    if (req.files && req.files.documents) {
      // Parse document names if sent as JSON string
      let docNames = [];
      if (req.body.documentNames) {
        try {
          docNames = typeof req.body.documentNames === 'string' ? JSON.parse(req.body.documentNames) : req.body.documentNames;
        } catch (e) {
          console.error('Error parsing document names:', e);
        }
      }

      documents = req.files.documents.map((file, index) => ({
        docName: docNames[index] || file.originalname,
        docUrl: `/uploads/organizations/${file.filename}`,
      }));
    }

    // Handle photo uploads
    let photos = [];
    if (req.files && req.files.photos) {
      // Parse photo names if sent as JSON string
      let photoNames = [];
      if (req.body.photoNames) {
        try {
          photoNames = typeof req.body.photoNames === 'string' ? JSON.parse(req.body.photoNames) : req.body.photoNames;
        } catch (e) {
          console.error('Error parsing photo names:', e);
        }
      }

      photos = req.files.photos.map((file, index) => ({
        photoName: photoNames[index] || file.originalname,
        photoUrl: `/uploads/organizations/${file.filename}`,
      }));
    }

    // Handle logo upload (optional)
    let logo = null;
    if (req.files && req.files.logo && req.files.logo.length > 0) {
      logo = `/uploads/organizations/${req.files.logo[0].filename}`;
    }

    // Create organization profile
    const organization = await Organization.create({
      userId: user._id,
      email: email.toLowerCase(),
      orgName,
      orgType,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      contactPerson: contactPerson || '',
      emergencyContactEmail: emergencyContactEmail || '',
      contactPhone: contactPhone || '',
      logo: logo,
      verified: false,
      currentStatus: 'Pending',
      documents: documents,
      photos: photos,
    });

    // Create initial request for the organization after registration
    const requestId = `REQ${Date.now()}`;
    const initialRequest = await Request.create({
      requestId,
      organizationId: organization._id,
      userId: user._id,
      status: 'Pending',
      resubmitted: false,
      previousRequestId: null,
      rejectionId: null,
    });

    // Update organization with latestRequestId
    organization.latestRequestId = initialRequest._id;
    await organization.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Log organization registration activity
    try {
      const { logAuthActivity } = require('../services/activityLogger');
      await logAuthActivity.organizationRegistered({
        _id: organization._id,
        id: organization._id,
        userId: user._id,
        email: user.email,
        name: organization.orgName,
      }, req);
    } catch (logError) {
      console.error('Error logging organization registration:', logError);
      // Don't fail the registration if logging fails
    }

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
        organization: {
          id: organization._id,
          orgName: organization.orgName,
          orgType: organization.orgType,
          verified: organization.verified,
          currentStatus: organization.currentStatus,
        },
        token,
      },
      message: 'Organization registered successfully',
    });

  } catch (error) {
    console.error('Organization registration error:', error);

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
        message: 'Email or organization email already registered',
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Server error during organization registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get organization dashboard statistics
 * @route   GET /api/v1/organizations/me/dashboard
 * @access  Private - Organization role only
 */
const getOrganizationDashboard = async (req, res) => {
  try {
    // Ensure user has organization role
    if (!req.user || req.user.role !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Only organization users can access this endpoint',
      });
    }

    // Find organization by userId
    const organization = await Organization.findOne({
      userId: req.user._id,
      isDeleted: false,
    }).lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found for this user',
      });
    }

    const organizationId = organization._id;

    // 1. Count homeless people added by this organization
    const homelessCount = await Homeless.countDocuments({
      organizationId: organizationId,
      isDeleted: false,
    });

    // 2. Get jobs posted by this organization
    // Query jobs directly from job collection - don't rely on organizationId/createdByUserId
    // Since existing jobs may only have merchantId, we query all jobs and filter

    // Get all jobs from the job collection (not filtered by organizationId/createdByUserId)
    // This gets jobs directly from the database
    const allJobs = await Job.find({
      isDeleted: false,
    }).lean();

    // Filter jobs that belong to this organization
    // A job belongs to the organization if:
    // 1. It has organizationId matching this organization, OR
    // 2. It has createdByUserId matching this organization's userId, OR  
    // 3. It has merchantId (for existing jobs - you may need to adjust this logic)

    const organizationJobs = allJobs.filter(job => {
      // Check organizationId
      if (job.organizationId && job.organizationId.toString() === organizationId.toString()) {
        return true;
      }

      // Check createdByUserId
      if (job.createdByUserId && job.createdByUserId.toString() === req.user._id.toString()) {
        return true;
      }

      // For existing jobs with only merchantId, include them
      // Note: This assumes all jobs with merchantId belong to organizations
      // You may need to adjust this logic based on your business rules
      if (job.merchantId) {
        return true; // Include jobs with merchantId
      }

      return false;
    });

    // Count total jobs
    const totalPostedJobs = organizationJobs.length;

    // Count active jobs
    const activeJobs = organizationJobs.filter(job => job.status === 'active').length;

    // 3. Applications received
    // Note: This requires an Application model or applications stored in Job model
    // For now, this is a placeholder that returns 0
    // TODO: Implement when Application model is available
    // You might need to:
    // - Create an Application model with jobId and applicantId
    // - Count applications for jobs posted by this organization
    const applicationsReceived = 0; // Placeholder

    // 4. Donations received
    // Calculate total donations (Money type, Completed status)
    const donationStats = await Donation.aggregate([
      {
        $match: {
          organizationId: organizationId,
          status: 'Completed',
          donationType: 'Money',
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $ifNull: ['$netAmount', '$amount'] } },
          count: { $sum: 1 }
        }
      }
    ]);

    const donationsReceived = donationStats.length > 0 ? donationStats[0].totalAmount : 0;
    const donationsCount = await Donation.countDocuments({
      organizationId: organizationId,
      status: 'Completed',
      isDeleted: false
    });

    // 5. Monthly Donation Data (for graph)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          organizationId: organizationId,
          status: 'Completed',
          donationType: 'Money',
          isDeleted: false,
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalAmount: { $sum: { $ifNull: ['$netAmount', '$amount'] } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format monthly data to ensure all 12 months are present
    const formattedMonthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyDonations.find(item => item._id === i + 1);
      return {
        month: i + 1,
        monthName: new Date(0, i).toLocaleString('default', { month: 'short' }),
        amount: monthData ? monthData.totalAmount : 0,
        count: monthData ? monthData.count : 0
      };
    });

    // Prepare dashboard response
    const dashboard = {
      summary: {
        homelessPeopleSupported: homelessCount,
        totalPostedJobs: totalPostedJobs,
        activeJobs: activeJobs,
        applicationsReceived: applicationsReceived,
        donationsReceived: {
          totalAmount: donationsReceived,
          count: donationsCount,
        },
      },
      monthlyDonations: formattedMonthlyData,
      kpiCards: [
        {
          title: 'Donations Received',
          value: `$${donationsReceived.toLocaleString()}`,
          description: `${donationsCount} total donations`,
          icon: 'dollar-sign', // Changed icon to match donation theme
        },
        {
          title: 'Available Jobs',
          value: activeJobs,
          description: 'Jobs currently hiring',
          icon: 'check-circle',
        },
        {
          title: 'Applications Received',
          value: applicationsReceived,
          description: 'Total job applications',
          icon: 'file-text',
        },
        {
          title: 'Homeless People Added',
          value: homelessCount,
          description: 'Count of profiles added',
          icon: 'users',
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: dashboard,
      message: 'Dashboard data fetched successfully',
    });
  } catch (error) {
    console.error('Get organization dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  getMyOrganization,
  registerOrganization,
  approveOrganization,
  rejectOrganization,
  requestReview,
  resubmitOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationDashboard,
};

