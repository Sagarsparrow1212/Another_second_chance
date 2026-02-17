const ActivityLog = require('../models/ActivityLog');

/**
 * Activity Logger Middleware
 * Only logs CREATE, UPDATE, DELETE, LOGIN, LOGOUT actions
 * Skips all GET requests and read-only operations
 */
const activityLogger = async (req, res, next) => {
  // Skip logging for analytics endpoints to avoid infinite loops
  if (req.path.includes('/analytics')) {
    return next();
  }

  // SKIP ALL GET REQUESTS - Only log actions (POST, PUT, PATCH, DELETE)
  if (req.method === 'GET') {
    return next();
  }

  // Only log specific action types: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  // Skip other operations
  const isLogin = req.method === 'POST' && (req.path.includes('/login') || req.path.includes('/auth/login'));
  const isLogout = req.method === 'POST' && (req.path.includes('/logout') || req.path.includes('/auth/logout'));
  const isCreate = req.method === 'POST' && !isLogin && !isLogout;
  const isUpdate = req.method === 'PUT' || req.method === 'PATCH';
  const isDelete = req.method === 'DELETE';

  // If it's not one of the actions we want to log, skip it
  if (!isLogin && !isLogout && !isCreate && !isUpdate && !isDelete) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;
  
  // Capture request details
  const logData = {
    userId: req.user?._id || null,
    userEmail: req.user?.email || null,
    userRole: req.user?.role || null,
    method: req.method,
    endpoint: req.path,
    ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
    metadata: {
      query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    },
  };

  // Determine module from path
  const pathParts = req.path.split('/').filter(Boolean);
  let module = 'system';
  if (pathParts.length > 0) {
    const firstPart = pathParts[0];
    if (firstPart === 'auth') module = 'auth';
    else if (firstPart === 'organizations') module = 'organization';
    else if (firstPart === 'merchants') module = 'merchant';
    else if (firstPart === 'donors') module = 'donor';
    else if (firstPart === 'homeless') module = 'homeless';
    else if (firstPart === 'jobs') module = 'job';
    else if (firstPart === 'chat') module = 'chat';
    else if (firstPart === 'dashboard') module = 'dashboard';
    else if (firstPart === 'admin') module = 'admin';
  }

  // Determine action from method and path
  let action = 'create';
  if (isLogin) {
    action = 'login';
  } else if (isLogout) {
    action = 'logout';
  } else if (isCreate) {
    if (req.path.includes('register')) action = 'register';
    else action = 'create';
  } else if (isUpdate) {
    action = 'update';
  } else if (isDelete) {
    action = 'delete';
  }

  // Helper function to generate title and section based on path and action
  const generateTitleAndSection = (path, actionType, responseData = null, reqBody = null) => {
    let title = '';
    let section = 'System';
    let resourceName = '';
    let isApproval = false;
    let isRejection = false;

    // Normalize path (remove query strings and ensure consistent format)
    // Also handle paths that might start with /api/v1 or just be relative
    let normalizedPath = path.split('?')[0].toLowerCase();
    console.log('Before normalization:', normalizedPath);
    
    if (normalizedPath.startsWith('/api/v')) {
      const beforeReplace = normalizedPath;
      normalizedPath = normalizedPath.replace(/^\/api\/v\d+\//, '');
      console.log('After replace:', normalizedPath, 'was:', beforeReplace);
    }
    // Ensure path starts with /
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    console.log('Final normalizedPath:', normalizedPath, 'original:', path);

    // Check for approval/rejection in path FIRST (before other checks)
    if (normalizedPath.includes('/approve')) {
      isApproval = true;
      actionType = 'APPROVE';
    } else if (normalizedPath.includes('/reject')) {
      isRejection = true;
      actionType = 'REJECT';
    }

    // Check request body for status changes
    if (reqBody) {
      if (reqBody.isApproved === true || reqBody.status === 'Approved' || reqBody.currentStatus === 'Approved') {
        isApproval = true;
        actionType = 'APPROVE';
      } else if (reqBody.isApproved === false || reqBody.status === 'Rejected' || reqBody.currentStatus === 'Rejected') {
        isRejection = true;
        actionType = 'REJECT';
      }
    }

    // Extract resource name from response if available (check multiple possible fields)
    try {
      if (responseData?.data) {
        const data = responseData.data;
        // Priority order: name, orgName, title, merchantName, email, username, businessName, donorFullName
        if (data.name) resourceName = data.name;
        else if (data.orgName) resourceName = data.orgName;
        else if (data.title) resourceName = data.title;
        else if (data.merchantName) resourceName = data.merchantName;
        else if (data.businessName) resourceName = data.businessName;
        else if (data.donorFullName) resourceName = data.donorFullName;
        else if (data.fullName) resourceName = data.fullName;
        else if (data.email) resourceName = data.email;
        else if (data.username) resourceName = data.username;
        else if (data.organizationName) resourceName = data.organizationName;
        
        // Check response for status changes
        if (data.currentStatus === 'Approved' || data.status === 'Approved') {
          isApproval = true;
          actionType = 'APPROVE';
        } else if (data.currentStatus === 'Rejected' || data.status === 'Rejected') {
          isRejection = true;
          actionType = 'REJECT';
        }
      }
      
      // Also check if responseData has name directly (for some delete responses)
      if (!resourceName && responseData?.data?.name) {
        resourceName = responseData.data.name;
      }
      
      // Check nested structures (e.g., responseData.data.organization.orgName)
      if (!resourceName && responseData?.data) {
        const data = responseData.data;
        if (data.organization?.orgName) resourceName = data.organization.orgName;
        else if (data.merchant?.merchantName) resourceName = data.merchant.merchantName;
        else if (data.donor?.donorFullName) resourceName = data.donor.donorFullName;
        else if (data.homeless?.fullName) resourceName = data.homeless.fullName;
      }
    } catch (e) {
      // Ignore
    }
    
    // If still no resource name and it's a DELETE, try to extract from request params or path
    if (!resourceName && actionType === 'DELETE') {
      // Try to get ID from path and use it as fallback identifier
      const pathParts = normalizedPath.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      // If last part looks like an ID (24 char hex), we can note it's a delete
      if (lastPart && lastPart.length === 24 && /^[0-9a-f]+$/i.test(lastPart)) {
        // ID found but no name - will use generic title
      }
    }

    // Determine section and title based on path (use normalized path)
    if (normalizedPath.includes('/auth/login') || normalizedPath.includes('/login')) {
      section = 'Authentication';
      title = 'User Logged In';
    } else if (normalizedPath.includes('/auth/logout') || normalizedPath.includes('/logout')) {
      section = 'Authentication';
      title = 'User Logged Out';
    } else if (normalizedPath.includes('/auth/register') || normalizedPath.includes('/register')) {
      section = 'Authentication';
      if (normalizedPath.includes('/organizations')) {
        title = 'Organization Registered';
      } else if (normalizedPath.includes('/merchants')) {
        title = 'Merchant Registered';
      } else if (normalizedPath.includes('/homeless')) {
        title = 'Homeless Person Registered';
      } else {
        title = 'User Registered';
      }
    } else if (normalizedPath.includes('/organizations') || normalizedPath.includes('/organization')) {
      // Check approval/rejection FIRST before other actions
      if (isApproval) {
        section = 'Admin Panel';
        title = resourceName ? `Organization Approved – ${resourceName}` : 'Organization Approved';
      } else if (isRejection) {
        section = 'Admin Panel';
        title = resourceName ? `Organization Rejected – ${resourceName}` : 'Organization Rejected';
      } else if (actionType === 'APPROVE') {
        // Also check actionType in case isApproval wasn't set but actionType was
        section = 'Admin Panel';
        title = resourceName ? `Organization Approved – ${resourceName}` : 'Organization Approved';
      } else if (actionType === 'REJECT') {
        // Also check actionType in case isRejection wasn't set but actionType was
        section = 'Admin Panel';
        title = resourceName ? `Organization Rejected – ${resourceName}` : 'Organization Rejected';
      } else {
        section = 'Organization Management';
        if (actionType === 'CREATE') {
          title = resourceName ? `Organization Created – ${resourceName}` : 'Organization Created';
        } else if (actionType === 'UPDATE') {
          title = resourceName ? `Organization Updated – ${resourceName}` : 'Organization Updated';
        } else if (actionType === 'DELETE') {
          title = resourceName ? `Organization Deleted – ${resourceName}` : 'Organization Deleted';
        }
      }
    } else if (normalizedPath.includes('/merchants') || normalizedPath.includes('/merchant')) {
      if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
        section = 'Job Management';
        if (actionType === 'CREATE') {
          title = resourceName ? `Job Created – ${resourceName}` : 'Job Created';
        } else if (actionType === 'UPDATE') {
          title = resourceName ? `Job Updated – ${resourceName}` : 'Job Updated';
        } else if (actionType === 'DELETE') {
          title = resourceName ? `Job Deleted – ${resourceName}` : 'Job Deleted';
        }
      } else {
        // Check approval/rejection FIRST before other actions
        if (isApproval) {
          section = 'Admin Panel';
          title = resourceName ? `Merchant Approved – ${resourceName}` : 'Merchant Approved';
        } else if (isRejection) {
          section = 'Admin Panel';
          title = resourceName ? `Merchant Rejected – ${resourceName}` : 'Merchant Rejected';
        } else {
          section = 'Merchant Management';
          if (actionType === 'CREATE') {
            title = resourceName ? `Merchant Created – ${resourceName}` : 'Merchant Created';
          } else if (actionType === 'UPDATE') {
            title = resourceName ? `Merchant Updated – ${resourceName}` : 'Merchant Updated';
          } else if (actionType === 'DELETE') {
            title = resourceName ? `Merchant Deleted – ${resourceName}` : 'Merchant Deleted';
          }
        }
      }
    } else if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
      section = 'Job Management';
      if (actionType === 'CREATE') {
        title = resourceName ? `Job Created – ${resourceName}` : 'Job Created';
      } else if (actionType === 'UPDATE') {
        title = resourceName ? `Job Updated – ${resourceName}` : 'Job Updated';
      } else if (actionType === 'DELETE') {
        title = resourceName ? `Job Deleted – ${resourceName}` : 'Job Deleted';
      }
    } else if (normalizedPath.includes('/donors') || normalizedPath.includes('/donor')) {
      section = 'Merchant Contributions';
      if (actionType === 'CREATE') {
        title = resourceName ? `Donor Created – ${resourceName}` : 'Donor Created';
      } else if (actionType === 'UPDATE') {
        title = resourceName ? `Donor Updated – ${resourceName}` : 'Donor Updated';
      } else if (actionType === 'DELETE') {
        title = resourceName ? `Donor Deleted – ${resourceName}` : 'Donor Deleted';
      }
    } else if (normalizedPath.includes('/homeless')) {
      section = 'Beneficiary Management';
      if (actionType === 'CREATE') {
        title = resourceName ? `Homeless Person Registered – ${resourceName}` : 'Homeless Person Registered';
      } else if (actionType === 'UPDATE') {
        title = resourceName ? `Homeless Profile Updated – ${resourceName}` : 'Homeless Profile Updated';
      } else if (actionType === 'DELETE') {
        title = resourceName ? `Homeless Person Deleted – ${resourceName}` : 'Homeless Person Deleted';
      }
    } else if (normalizedPath.includes('/admin')) {
      section = 'Admin Panel';
      if (actionType === 'CREATE') {
        title = 'Admin Action Performed';
      } else if (actionType === 'UPDATE') {
        title = 'Admin Update Performed';
      } else if (actionType === 'DELETE') {
        title = 'Admin Delete Performed';
      }
    }

    // Fallback titles if not set - but try to be more specific
    if (!title) {
      // If we detected approval/rejection but didn't set a title, try to infer from path
      if (isApproval) {
        if (normalizedPath.includes('/organizations') || normalizedPath.includes('/organization')) {
          section = 'Admin Panel';
          title = resourceName ? `Organization Approved – ${resourceName}` : 'Organization Approved';
        } else if (normalizedPath.includes('/merchants') || normalizedPath.includes('/merchant')) {
          section = 'Admin Panel';
          title = resourceName ? `Merchant Approved – ${resourceName}` : 'Merchant Approved';
        } else {
          section = 'Admin Panel';
          title = 'Resource Approved';
        }
      } else if (isRejection) {
        if (normalizedPath.includes('/organizations') || normalizedPath.includes('/organization')) {
          section = 'Admin Panel';
          title = resourceName ? `Organization Rejected – ${resourceName}` : 'Organization Rejected';
        } else if (normalizedPath.includes('/merchants') || normalizedPath.includes('/merchant')) {
          section = 'Admin Panel';
          title = resourceName ? `Merchant Rejected – ${resourceName}` : 'Merchant Rejected';
        } else {
          section = 'Admin Panel';
          title = 'Resource Rejected';
        }
      } else if (actionType === 'CREATE') {
        // Try to infer from path
        if (normalizedPath.includes('/organizations') || normalizedPath.includes('/organization')) {
          section = 'Organization Management';
          title = resourceName ? `Organization Created – ${resourceName}` : 'Organization Created';
        } else if (normalizedPath.includes('/merchants') || normalizedPath.includes('/merchant')) {
          if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
            section = 'Job Management';
            title = resourceName ? `Job Created – ${resourceName}` : 'Job Created';
          } else {
            section = 'Merchant Management';
            title = resourceName ? `Merchant Created – ${resourceName}` : 'Merchant Created';
          }
        } else if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
          section = 'Job Management';
          title = resourceName ? `Job Created – ${resourceName}` : 'Job Created';
        } else if (normalizedPath.includes('/donors') || normalizedPath.includes('/donor')) {
          section = 'Merchant Contributions';
          title = resourceName ? `Donor Created – ${resourceName}` : 'Donor Created';
        } else if (normalizedPath.includes('/homeless')) {
          section = 'Beneficiary Management';
          title = resourceName ? `Homeless Person Registered – ${resourceName}` : 'Homeless Person Registered';
        } else {
          title = 'Resource Created';
        }
      } else if (actionType === 'UPDATE') {
        // Try to infer from path
        if (normalizedPath.includes('/organizations') || normalizedPath.includes('/organization')) {
          section = 'Organization Management';
          title = resourceName ? `Organization Updated – ${resourceName}` : 'Organization Updated';
        } else if (normalizedPath.includes('/merchants') || normalizedPath.includes('/merchant')) {
          if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
            section = 'Job Management';
            title = resourceName ? `Job Updated – ${resourceName}` : 'Job Updated';
          } else {
            section = 'Merchant Management';
            title = resourceName ? `Merchant Updated – ${resourceName}` : 'Merchant Updated';
          }
        } else if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
          section = 'Job Management';
          title = resourceName ? `Job Updated – ${resourceName}` : 'Job Updated';
        } else if (normalizedPath.includes('/donors') || normalizedPath.includes('/donor')) {
          section = 'Merchant Contributions';
          title = resourceName ? `Donor Updated – ${resourceName}` : 'Donor Updated';
        } else if (normalizedPath.includes('/homeless')) {
          section = 'Beneficiary Management';
          title = resourceName ? `Homeless Profile Updated – ${resourceName}` : 'Homeless Profile Updated';
        } else {
          title = 'Resource Updated';
        }
      } else if (actionType === 'DELETE') {
        // Try to infer from path - this is critical for DELETE actions
        if (normalizedPath.includes('/organizations') || normalizedPath.includes('/organization')) {
          section = 'Organization Management';
          title = resourceName ? `Organization Deleted – ${resourceName}` : 'Organization Deleted';
        } else if (normalizedPath.includes('/merchants') || normalizedPath.includes('/merchant')) {
          if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
            section = 'Job Management';
            title = resourceName ? `Job Deleted – ${resourceName}` : 'Job Deleted';
          } else {
            section = 'Merchant Management';
            title = resourceName ? `Merchant Deleted – ${resourceName}` : 'Merchant Deleted';
          }
        } else if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
          section = 'Job Management';
          title = resourceName ? `Job Deleted – ${resourceName}` : 'Job Deleted';
        } else if (normalizedPath.includes('/donors') || normalizedPath.includes('/donor')) {
          section = 'Merchant Contributions';
          title = resourceName ? `Donor Deleted – ${resourceName}` : 'Donor Deleted';
        } else if (normalizedPath.includes('/homeless')) {
          section = 'Beneficiary Management';
          title = resourceName ? `Homeless Person Deleted – ${resourceName}` : 'Homeless Person Deleted';
        } else {
          title = 'Resource Deleted';
        }
      } else if (actionType === 'LOGIN') {
        title = 'User Logged In';
      } else if (actionType === 'LOGOUT') {
        title = 'User Logged Out';
      } else {
        title = 'Action Performed';
      }
    }

    // Ensure section is not 'System' if we have a better one
    if (section === 'System') {
      // Try to infer section from path if we still have 'System'
      // Check for all resource types and set appropriate section
      if (normalizedPath.includes('/organizations') || normalizedPath.includes('/organization')) {
        if (isApproval || isRejection || actionType === 'APPROVE' || actionType === 'REJECT') {
          section = 'Admin Panel';
          if (!title) {
            if (isApproval || actionType === 'APPROVE') {
              title = resourceName ? `Organization Approved – ${resourceName}` : 'Organization Approved';
            } else if (isRejection || actionType === 'REJECT') {
              title = resourceName ? `Organization Rejected – ${resourceName}` : 'Organization Rejected';
            }
          }
        } else {
          section = 'Organization Management';
          if (!title) {
            if (actionType === 'CREATE') title = resourceName ? `Organization Created – ${resourceName}` : 'Organization Created';
            else if (actionType === 'UPDATE') title = resourceName ? `Organization Updated – ${resourceName}` : 'Organization Updated';
            else if (actionType === 'DELETE') title = resourceName ? `Organization Deleted – ${resourceName}` : 'Organization Deleted';
          }
        }
      } else if (normalizedPath.includes('/merchants') || normalizedPath.includes('/merchant')) {
        if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
          section = 'Job Management';
          if (!title) {
            if (actionType === 'CREATE') title = resourceName ? `Job Created – ${resourceName}` : 'Job Created';
            else if (actionType === 'UPDATE') title = resourceName ? `Job Updated – ${resourceName}` : 'Job Updated';
            else if (actionType === 'DELETE') title = resourceName ? `Job Deleted – ${resourceName}` : 'Job Deleted';
          }
        } else {
          if (isApproval || isRejection || actionType === 'APPROVE' || actionType === 'REJECT') {
            section = 'Admin Panel';
            if (!title) {
              if (isApproval || actionType === 'APPROVE') {
                title = resourceName ? `Merchant Approved – ${resourceName}` : 'Merchant Approved';
              } else if (isRejection || actionType === 'REJECT') {
                title = resourceName ? `Merchant Rejected – ${resourceName}` : 'Merchant Rejected';
              }
            }
          } else {
            section = 'Merchant Management';
            if (!title) {
              if (actionType === 'CREATE') title = resourceName ? `Merchant Created – ${resourceName}` : 'Merchant Created';
              else if (actionType === 'UPDATE') title = resourceName ? `Merchant Updated – ${resourceName}` : 'Merchant Updated';
              else if (actionType === 'DELETE') title = resourceName ? `Merchant Deleted – ${resourceName}` : 'Merchant Deleted';
            }
          }
        }
      } else if (normalizedPath.includes('/jobs') || normalizedPath.includes('/job')) {
        section = 'Job Management';
        if (!title) {
          if (actionType === 'CREATE') title = resourceName ? `Job Created – ${resourceName}` : 'Job Created';
          else if (actionType === 'UPDATE') title = resourceName ? `Job Updated – ${resourceName}` : 'Job Updated';
          else if (actionType === 'DELETE') title = resourceName ? `Job Deleted – ${resourceName}` : 'Job Deleted';
        }
      } else if (normalizedPath.includes('/homeless')) {
        section = 'Beneficiary Management';
        if (!title) {
          if (actionType === 'CREATE') title = resourceName ? `Homeless Person Registered – ${resourceName}` : 'Homeless Person Registered';
          else if (actionType === 'UPDATE') title = resourceName ? `Homeless Profile Updated – ${resourceName}` : 'Homeless Profile Updated';
          else if (actionType === 'DELETE') title = resourceName ? `Homeless Person Deleted – ${resourceName}` : 'Homeless Person Deleted';
        }
      } else if (normalizedPath.includes('/donors') || normalizedPath.includes('/donor')) {
        section = 'Merchant Contributions';
        if (!title) {
          if (actionType === 'CREATE') title = resourceName ? `Donor Created – ${resourceName}` : 'Donor Created';
          else if (actionType === 'UPDATE') title = resourceName ? `Donor Updated – ${resourceName}` : 'Donor Updated';
          else if (actionType === 'DELETE') title = resourceName ? `Donor Deleted – ${resourceName}` : 'Donor Deleted';
        }
      }
      
      // Final fallback - if still System and we have approval/rejection, set to Admin Panel
      if (section === 'System' && (isApproval || isRejection || actionType === 'APPROVE' || actionType === 'REJECT')) {
        section = 'Admin Panel';
      }
    }

    return { title, section, actionType };
  };

  // Override res.send to capture response
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Only log successful operations (2xx status codes)
    if (statusCode < 200 || statusCode >= 300) {
      return originalSend.call(this, data);
    }

    let status = 'SUCCESS';
    if (statusCode >= 500) status = 'FAILED';
    else if (statusCode >= 400) status = 'FAILED';
    else if (statusCode >= 200 && statusCode < 300) status = 'SUCCESS';
    else status = 'PENDING';

    // Extract resource information if available
    let resourceType = null;
    let resourceId = null;
    let responseData = null;
    
    try {
      responseData = typeof data === 'string' ? JSON.parse(data) : data;
      if (responseData?.data) {
        const dataObj = responseData.data;
        if (dataObj._id) {
          resourceId = dataObj._id;
        }
        if (dataObj.id) {
          resourceId = dataObj.id;
        }
        // Also check for nested data structures
        if (dataObj.user?._id) {
          resourceId = dataObj.user._id;
        }
        if (dataObj.organization?._id) {
          resourceId = dataObj.organization._id;
        }
        if (dataObj.job?._id) {
          resourceId = dataObj.job._id;
        }
        if (dataObj.merchant?._id) {
          resourceId = dataObj.merchant._id;
        }
        if (dataObj.homeless?._id) {
          resourceId = dataObj.homeless._id;
        }
      }
      
      // Determine resource type from path (use originalUrl to get full path including /api/v1)
      const fullReqPath = (req.originalUrl || req.url || req.path).split('?')[0].toLowerCase();
      if (fullReqPath.includes('/organizations') || fullReqPath.includes('/organization')) {
        resourceType = 'Organization';
      } else if (fullReqPath.includes('/merchants') || fullReqPath.includes('/merchant')) {
        if (fullReqPath.includes('/jobs') || fullReqPath.includes('/job')) {
          resourceType = 'Job';
        } else {
          resourceType = 'Merchant';
        }
      } else if (fullReqPath.includes('/donors') || fullReqPath.includes('/donor')) {
        resourceType = 'Donor';
      } else if (fullReqPath.includes('/homeless')) {
        resourceType = 'Homeless';
      } else if (fullReqPath.includes('/jobs') || fullReqPath.includes('/job')) {
        resourceType = 'Job';
      } else if (fullReqPath.includes('/auth')) {
        resourceType = 'User';
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Generate title and section (pass request body to detect approval/rejection)
    // Use req.originalUrl or req.url instead of req.path to get the full path including /api/v1
    const fullPath = req.originalUrl || req.url || req.path;
    const pathWithoutQuery = fullPath.split('?')[0]; // Remove query string
    let baseActionType = isLogin ? 'LOGIN' : isLogout ? 'LOGOUT' : isCreate ? 'CREATE' : isUpdate ? 'UPDATE' : isDelete ? 'DELETE' : 'VIEW';
    const { title, section, actionType: finalActionType } = generateTitleAndSection(pathWithoutQuery, baseActionType, responseData, req.body);

    // Generate description
    let description = '';
    if (finalActionType === 'APPROVE') {
      description = `${resourceType || 'Resource'} approved successfully`;
    } else if (finalActionType === 'REJECT') {
      description = `${resourceType || 'Resource'} rejected`;
    } else if (isLogin) {
      description = `User logged in successfully`;
    } else if (isLogout) {
      description = `User logged out`;
    } else if (isCreate) {
      description = `${resourceType || 'Resource'} created successfully`;
    } else if (isUpdate) {
      description = `${resourceType || 'Resource'} updated successfully`;
    } else if (isDelete) {
      description = `${resourceType || 'Resource'} deleted successfully`;
    }

    // Log activity asynchronously (don't block response)
    ActivityLog.create({
      title,
      description,
      section,
      actorId: logData.userId,
      actorEmail: logData.userEmail,
      actorRole: logData.userRole,
      actionType: finalActionType,
      targetId: resourceId,
      targetType: resourceType,
      status,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      metadata: {
        method: req.method,
        endpoint: req.path,
        statusCode,
        responseTime,
        module,
        action,
        ...logData.metadata,
      },
      activityTime: new Date(startTime),
    }).catch(err => {
      console.error('Activity log error:', err);
      // Don't throw error, just log it
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Log user action (for frontend events)
 */
const logUserAction = async (data) => {
  try {
    await ActivityLog.create({
      ...data,
      actionType: 'user_action',
      // Section mapping
      section: req.path.includes('/auth') ? 'Authentication' :
               req.path.includes('/organizations') ? 'Organization Management' :
               req.path.includes('/merchants') ? 'Merchant Management' :
               req.path.includes('/jobs') ? 'Job Management' :
               req.path.includes('/homeless') ? 'Beneficiary Management' :
               req.path.includes('/admin') ? 'Admin Panel' :
               req.path.includes('/analytics') ? 'System Logs' :
               'System',
      
      // Title generation
      title: `${req.method} ${req.path}`,
      
      // Description
      description: `${req.user?.email || 'Anonymous'} performed ${req.method} on ${req.path}`,

      timestamp: new Date(),
    });
  } catch (error) {
    console.error('User action log error:', error);
  }
};

/**
 * Log system event
 */
const logSystemEvent = async (data) => {
  try {
    await ActivityLog.create({
      ...data,
      actionType: 'system_event',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('System event log error:', error);
  }
};

/**
 * Log error
 */
const logError = async (error, req = null) => {
  try {
    const path = req?.path || '';
    let section = 'System Logs';
    if (path.includes('/organizations')) section = 'Organization Management';
    else if (path.includes('/merchants')) section = 'Merchant Management';
    else if (path.includes('/jobs')) section = 'Job Management';
    else if (path.includes('/homeless')) section = 'Beneficiary Management';
    else if (path.includes('/auth')) section = 'Authentication';
    else if (path.includes('/admin')) section = 'Admin Panel';

    await ActivityLog.create({
      title: `API Error – ${error.message || 'Operation Failed'}`,
      description: error.message || 'An error occurred',
      section,
      actorId: req?.user?._id || null,
      actorEmail: req?.user?.email || null,
      actorRole: req?.user?.role || null,
      module: req?.path?.split('/').filter(Boolean)[0] || 'system',
      action: 'error',
      actionType: 'ERROR',
      status: 'FAILED',
      statusCode: 500,
      endpoint: req?.path || null,
      method: req?.method || null,
      ipAddress: req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
      },
      activityTime: new Date(),
      timestamp: new Date(),
    });
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
};

module.exports = {
  activityLogger,
  logUserAction,
  logSystemEvent,
  logError,
};

