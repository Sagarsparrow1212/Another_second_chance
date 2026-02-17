const ActivityLog = require('../models/ActivityLog');

/**
 * Extract device/platform from user agent
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { device: null, platform: null };
  
  const ua = userAgent.toLowerCase();
  let device = 'Desktop';
  let platform = 'Web';
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  }
  
  if (ua.includes('android')) {
    platform = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('mac')) {
    platform = 'iOS';
  } else if (ua.includes('windows')) {
    platform = 'Windows';
  } else if (ua.includes('linux')) {
    platform = 'Linux';
  } else if (ua.includes('mac')) {
    platform = 'macOS';
  }
  
  return { device, platform };
};

/**
 * Create activity log entry
 */
const createActivityLog = async (data) => {
  try {
    const { userAgent, ...logData } = data;
    const { device, platform } = parseUserAgent(userAgent);
    
    const activityLog = new ActivityLog({
      ...logData,
      device,
      platform,
      userAgent,
      activityTime: new Date(),
    });
    
    await activityLog.save();
    return activityLog;
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw error - logging should not break the application
    return null;
  }
};

/**
 * Authentication Activities
 */
const logAuthActivity = {
  organizationRegistered: async (organizationData, req) => {
    return await createActivityLog({
      title: 'Organization Registered',
      description: `Organization account created: ${organizationData.name || organizationData.email}`,
      section: 'Authentication',
      actionType: 'REGISTER',
      actorId: organizationData.userId || null,
      actorEmail: organizationData.email || null,
      actorRole: 'organization',
      status: 'SUCCESS',
      targetId: organizationData._id || organizationData.id || null,
      targetType: 'Organization',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        organizationName: organizationData.name,
        email: organizationData.email,
      },
    });
  },
  
  merchantRegistered: async (merchantData, req) => {
    return await createActivityLog({
      title: 'Merchant Registered',
      description: `New merchant account registered: ${merchantData.name || merchantData.email}`,
      section: 'Authentication',
      actionType: 'REGISTER',
      actorId: merchantData.userId || null,
      actorEmail: merchantData.email || null,
      actorRole: 'merchant',
      status: 'SUCCESS',
      targetId: merchantData._id || merchantData.id || null,
      targetType: 'Merchant',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        merchantName: merchantData.name,
        email: merchantData.email,
      },
    });
  },
  
  volunteerRegistered: async (volunteerData, req, createdBy) => {
    return await createActivityLog({
      title: 'Volunteer Registered',
      description: `Volunteer account created by organization`,
      section: 'Authentication',
      actionType: 'CREATE',
      actorId: createdBy?._id || createdBy?.id || null,
      actorEmail: createdBy?.email || null,
      actorRole: createdBy?.role || 'organization',
      status: 'SUCCESS',
      targetId: volunteerData._id || volunteerData.id || null,
      targetType: 'User',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        volunteerEmail: volunteerData.email,
        createdBy: createdBy?.email,
      },
    });
  },
  
  login: async (user, req) => {
    return await createActivityLog({
      title: 'User Logged In',
      description: `User logged in successfully`,
      section: 'Authentication',
      actionType: 'LOGIN',
      actorId: user._id || user.id || null,
      actorEmail: user.email || null,
      actorRole: user.role || null,
      status: 'SUCCESS',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        role: user.role,
      },
    });
  },
  
  logout: async (user, req) => {
    return await createActivityLog({
      title: 'User Logged Out',
      description: `User logged out`,
      section: 'Authentication',
      actionType: 'LOGOUT',
      actorId: user._id || user.id || null,
      actorEmail: user.email || null,
      actorRole: user.role || null,
      status: 'SUCCESS',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
    });
  },
};

/**
 * Organization Activities
 */
const logOrganizationActivity = {
  profileUpdated: async (organizationData, req, user) => {
    return await createActivityLog({
      title: 'Organization Profile Updated',
      description: `Organization profile updated`,
      section: 'Organization Management',
      actionType: 'UPDATE',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: organizationData._id || organizationData.id || null,
      targetType: 'Organization',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        organizationId: organizationData._id || organizationData.id,
      },
    });
  },
  
  approved: async (organizationData, req, admin) => {
    return await createActivityLog({
      title: 'Organization Approved',
      description: `Organization approved by admin`,
      section: 'Admin Panel',
      actionType: 'APPROVE',
      actorId: admin?._id || admin?.id || null,
      actorEmail: admin?.email || null,
      actorRole: 'admin',
      status: 'SUCCESS',
      targetId: organizationData._id || organizationData.id || null,
      targetType: 'Organization',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        organizationName: organizationData.name,
      },
    });
  },
};

/**
 * Job Activities
 */
const logJobActivity = {
  created: async (jobData, req, user) => {
    return await createActivityLog({
      title: `Job Created – ${jobData.title || jobData.name || 'Untitled'}`,
      description: `New job created`,
      section: 'Job Management',
      actionType: 'CREATE',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: jobData._id || jobData.id || null,
      targetType: 'Job',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        jobTitle: jobData.title || jobData.name,
        jobId: jobData._id || jobData.id,
      },
    });
  },
  
  updated: async (jobData, req, user) => {
    return await createActivityLog({
      title: `Job Updated – ${jobData.title || jobData.name || 'Untitled'}`,
      description: `Job details updated`,
      section: 'Job Management',
      actionType: 'UPDATE',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: jobData._id || jobData.id || null,
      targetType: 'Job',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        jobTitle: jobData.title || jobData.name,
      },
    });
  },
  
  deleted: async (jobData, req, user) => {
    return await createActivityLog({
      title: `Job Removed – ${jobData.title || jobData.name || 'Untitled'}`,
      description: `Job deleted`,
      section: 'Job Management',
      actionType: 'DELETE',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: jobData._id || jobData.id || null,
      targetType: 'Job',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        jobTitle: jobData.title || jobData.name,
      },
    });
  },
  
  assigned: async (jobData, assigneeData, req, user) => {
    return await createActivityLog({
      title: 'Job Assigned to Volunteer',
      description: `Job assigned to ${assigneeData.email || assigneeData.name || 'volunteer'}`,
      section: 'Job Assignment',
      actionType: 'ASSIGN',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: jobData._id || jobData.id || null,
      targetType: 'Job',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        jobTitle: jobData.title || jobData.name,
        assigneeId: assigneeData._id || assigneeData.id,
        assigneeEmail: assigneeData.email,
      },
    });
  },
};

/**
 * Homeless/Beneficiary Activities
 */
const logHomelessActivity = {
  registered: async (homelessData, req, user) => {
    return await createActivityLog({
      title: 'New Homeless Person Registered',
      description: `Homeless person registered by organization`,
      section: 'Beneficiary Management',
      actionType: 'CREATE',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: homelessData._id || homelessData.id || null,
      targetType: 'Homeless',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        homelessId: homelessData._id || homelessData.id,
        name: homelessData.name,
      },
    });
  },
  
  profileUpdated: async (homelessData, req, user) => {
    return await createActivityLog({
      title: 'Homeless Profile Updated',
      description: `Homeless person profile updated`,
      section: 'Beneficiary Management',
      actionType: 'UPDATE',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: homelessData._id || homelessData.id || null,
      targetType: 'Homeless',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        homelessId: homelessData._id || homelessData.id,
      },
    });
  },
  
  assignedToJob: async (homelessData, jobData, req, user) => {
    return await createActivityLog({
      title: `Homeless Assigned to Job – ${jobData.title || jobData.name || 'Job'}`,
      description: `Homeless person assigned to job`,
      section: 'Assignment',
      actionType: 'ASSIGN',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'organization',
      status: 'SUCCESS',
      targetId: homelessData._id || homelessData.id || null,
      targetType: 'Homeless',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        homelessId: homelessData._id || homelessData.id,
        jobId: jobData._id || jobData.id,
        jobTitle: jobData.title || jobData.name,
      },
    });
  },
};

/**
 * Merchant Activities
 */
const logMerchantActivity = {
  approved: async (merchantData, req, admin) => {
    return await createActivityLog({
      title: 'Merchant Approved',
      description: `Merchant approved by admin`,
      section: 'Admin Panel',
      actionType: 'APPROVE',
      actorId: admin?._id || admin?.id || null,
      actorEmail: admin?.email || null,
      actorRole: 'admin',
      status: 'SUCCESS',
      targetId: merchantData._id || merchantData.id || null,
      targetType: 'Merchant',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        merchantName: merchantData.name,
      },
    });
  },
  
  donationAdded: async (donationData, req, merchant) => {
    return await createActivityLog({
      title: `Donation Added – ${donationData.name || donationData.type || 'Resource'}`,
      description: `Merchant added donation/resource`,
      section: 'Merchant Contributions',
      actionType: 'CREATE',
      actorId: merchant?._id || merchant?.id || null,
      actorEmail: merchant?.email || null,
      actorRole: 'merchant',
      status: 'SUCCESS',
      targetId: donationData._id || donationData.id || null,
      targetType: 'Donation',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        donationType: donationData.type,
        donationName: donationData.name,
      },
    });
  },
};

/**
 * Admin Activities
 */
const logAdminActivity = {
  roleAssigned: async (userData, role, req, admin) => {
    return await createActivityLog({
      title: `Role Assigned – ${role}`,
      description: `Role assigned to user`,
      section: 'Admin Management',
      actionType: 'ROLE_ASSIGN',
      actorId: admin?._id || admin?.id || null,
      actorEmail: admin?.email || null,
      actorRole: 'admin',
      status: 'SUCCESS',
      targetId: userData._id || userData.id || null,
      targetType: 'User',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        userId: userData._id || userData.id,
        userEmail: userData.email,
        assignedRole: role,
      },
    });
  },
  
  userBlocked: async (userData, req, admin) => {
    return await createActivityLog({
      title: 'User Blocked',
      description: `User blocked by admin`,
      section: 'Admin Panel',
      actionType: 'BLOCK',
      actorId: admin?._id || admin?.id || null,
      actorEmail: admin?.email || null,
      actorRole: 'admin',
      status: 'SUCCESS',
      targetId: userData._id || userData.id || null,
      targetType: 'User',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        userId: userData._id || userData.id,
        userEmail: userData.email,
      },
    });
  },
};

/**
 * System Activities
 */
const logSystemActivity = {
  backgroundJob: async (jobName, metadata = {}) => {
    return await createActivityLog({
      title: jobName,
      description: `Background job executed`,
      section: 'System',
      actionType: 'BACKGROUND_JOB',
      actorRole: 'system',
      status: 'SUCCESS',
      metadata,
    });
  },
  
  error: async (error, req, context = {}) => {
    return await createActivityLog({
      title: `API Error – ${context.action || 'Operation Failed'}`,
      description: error.message || 'An error occurred',
      section: 'System Logs',
      actionType: 'ERROR',
      actorId: req?.user?._id || req?.user?.id || null,
      actorEmail: req?.user?.email || null,
      actorRole: req?.user?.role || 'system',
      status: 'FAILED',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
        ...context,
      },
    });
  },
};

/**
 * Notification Activities
 */
const logNotificationActivity = {
  sent: async (notificationData, req, user) => {
    return await createActivityLog({
      title: `${notificationData.type || 'Notification'} Sent`,
      description: `Notification sent to user`,
      section: 'Notifications',
      actionType: 'NOTIFICATION_SENT',
      actorId: user?._id || user?.id || null,
      actorEmail: user?.email || null,
      actorRole: user?.role || 'system',
      status: 'SUCCESS',
      targetId: notificationData.recipientId || null,
      targetType: 'User',
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        notificationType: notificationData.type,
        recipientId: notificationData.recipientId,
      },
    });
  },
};

module.exports = {
  createActivityLog,
  logAuthActivity,
  logOrganizationActivity,
  logJobActivity,
  logHomelessActivity,
  logMerchantActivity,
  logAdminActivity,
  logSystemActivity,
  logNotificationActivity,
};

