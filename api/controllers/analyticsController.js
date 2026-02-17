const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Merchant = require('../models/Merchant');
const Donor = require('../models/Donor');
const Homeless = require('../models/Homeless');
const Job = require('../models/Job');

/**
 * @desc    Get real-time analytics overview
 * @route   GET /api/v1/analytics/overview
 * @access  Private - Admin only
 */
const getAnalyticsOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    // Get date range (default: last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total activities
    const totalActivities = await ActivityLog.countDocuments(dateFilter);

    // Success vs Failure
    const successCount = await ActivityLog.countDocuments({ ...dateFilter, status: 'success' });
    const failureCount = await ActivityLog.countDocuments({ ...dateFilter, status: 'failure' });
    const errorCount = await ActivityLog.countDocuments({ ...dateFilter, status: 'error' });

    // User statistics
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const activeUsers = await ActivityLog.distinct('userId', {
      ...dateFilter,
      userId: { $ne: null },
    });
    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end },
      isDeleted: false,
    });

    // Module activity breakdown
    const moduleActivity = await ActivityLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failure: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Role-based activity
    const roleActivity = await ActivityLog.aggregate([
      { $match: { ...dateFilter, userRole: { $ne: null } } },
      {
        $group: {
          _id: '$userRole',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Average response time
    const avgResponseTime = await ActivityLog.aggregate([
      {
        $match: {
          ...dateFilter,
          responseTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalActivities,
          successCount,
          failureCount,
          errorCount,
          successRate: totalActivities > 0 ? ((successCount / totalActivities) * 100).toFixed(2) : 0,
        },
        users: {
          total: totalUsers,
          active: activeUsers.length,
          new: newUsers,
          returning: activeUsers.length - newUsers,
        },
        moduleActivity: moduleActivity.map(m => ({
          module: m._id,
          total: m.count,
          success: m.success,
          failure: m.failure,
        })),
        roleActivity: roleActivity.map(r => ({
          role: r._id,
          count: r.count,
        })),
        performance: {
          avgResponseTime: avgResponseTime[0]?.avgResponseTime?.toFixed(2) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics overview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get activity trends over time
 * @route   GET /api/v1/analytics/trends
 * @access  Private - Admin only
 */
const getActivityTrends = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    let groupFormat;
    if (groupBy === 'hour') {
      groupFormat = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' },
      };
    } else if (groupBy === 'week') {
      groupFormat = {
        year: { $year: '$timestamp' },
        week: { $week: '$timestamp' },
      };
    } else {
      groupFormat = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
      };
    }

    const trends = await ActivityLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failure: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          },
          error: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$responseTime', null] },
                '$responseTime',
                '$$REMOVE'
              ]
            }
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        trends: trends.map(t => ({
          date: formatDateFromGroup(t._id, groupBy),
          count: t.count,
          success: t.success,
          failure: t.failure,
          error: t.error,
          avgResponseTime: t.avgResponseTime?.toFixed(2) || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Get activity trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity trends',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get feature usage statistics
 * @route   GET /api/v1/analytics/features
 * @access  Private - Admin only
 */
const getFeatureUsage = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    const featureUsage = await ActivityLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            module: '$module',
            action: '$action',
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          module: '$_id.module',
          action: '$_id.action',
          count: 1,
          uniqueUsers: { $size: { $filter: { input: '$uniqueUsers', as: 'user', cond: { $ne: ['$$user', null] } } } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        features: featureUsage.map(f => ({
          module: f.module,
          action: f.action,
          usageCount: f.count,
          uniqueUsers: f.uniqueUsers,
        })),
      },
    });
  } catch (error) {
    console.error('Get feature usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feature usage',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get usage heatmap (hourly activity by day of week)
 * @route   GET /api/v1/analytics/heatmap
 * @access  Private - Admin only
 */
const getUsageHeatmap = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    const heatmap = await ActivityLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            dayOfWeek: '$dayOfWeek',
            hour: '$hour',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]);

    // Format for heatmap visualization
    const heatmapData = {};
    heatmap.forEach(item => {
      const day = item._id.dayOfWeek;
      const hour = item._id.hour;
      if (!heatmapData[day]) heatmapData[day] = {};
      heatmapData[day][hour] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        heatmap: heatmapData,
      },
    });
  } catch (error) {
    console.error('Get usage heatmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching usage heatmap',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get recent activities with filters
 * @route   GET /api/v1/analytics/activities
 * @access  Private - Admin only
 */
const getRecentActivities = async (req, res) => {
  try {
    const {
      limit = 50,
      page = 1,
      section,
      actionType,
      status,
      actorRole,
      startDate,
      endDate,
      search,
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    
    // Use new fields if available, fallback to legacy fields
    if (section) filter.section = section;
    else if (req.query.module) filter.module = req.query.module;
    
    if (actionType) filter.actionType = actionType;
    else if (req.query.action) filter.action = req.query.action;
    
    if (status) {
      // Map status values
      const statusMap = {
        success: 'SUCCESS',
        failure: 'FAILED',
        pending: 'PENDING',
        error: 'FAILED',
      };
      filter.status = statusMap[status.toLowerCase()] || status.toUpperCase();
    }
    
    if (actorRole) filter.actorRole = actorRole;
    else if (req.query.userRole) filter.userRole = req.query.userRole;
    
    // Date range filter
    if (startDate || endDate) {
      filter.activityTime = {};
      if (startDate) filter.activityTime.$gte = new Date(startDate);
      if (endDate) filter.activityTime.$lte = new Date(endDate);
    }
    
    // Search filter (title or description)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const activities = await ActivityLog.find(filter)
      .populate('actorId', 'email role')
      .sort({ activityTime: -1, timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await ActivityLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        activities: activities.map(activity => ({
          id: activity._id,
          activityId: activity.activityId,
          title: activity.title,
          description: activity.description,
          actorId: activity.actorId?._id || activity.actorId || activity.userId,
          actorEmail: activity.actorEmail || activity.actorId?.email || activity.userEmail,
          actorRole: activity.actorRole || activity.actorId?.role || activity.userRole,
          section: activity.section || activity.module,
          actionType: activity.actionType || activity.action,
          targetId: activity.targetId || activity.resourceId,
          targetType: activity.targetType || activity.resourceType,
          status: activity.status,
          activityTime: activity.activityTime || activity.timestamp,
          ipAddress: activity.ipAddress,
          device: activity.device,
          platform: activity.platform,
          endpoint: activity.endpoint,
          method: activity.method,
          responseTime: activity.responseTime,
          metadata: activity.metadata,
        })),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent activities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get user activity statistics
 * @route   GET /api/v1/analytics/users
 * @access  Private - Admin only
 */
const getUserActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    // Most active users
    const mostActiveUsers = await ActivityLog.aggregate([
      {
        $match: {
          ...dateFilter,
          userId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$userId',
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' },
        },
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]);

    // User activity by role
    const activityByRole = await ActivityLog.aggregate([
      {
        $match: {
          ...dateFilter,
          userRole: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$userRole',
          totalActivities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          role: '$_id',
          totalActivities: 1,
          uniqueUsers: { $size: { $filter: { input: '$uniqueUsers', as: 'user', cond: { $ne: ['$$user', null] } } } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        mostActiveUsers: mostActiveUsers.map(u => ({
          userId: u._id,
          email: u.user?.email || 'Unknown',
          role: u.user?.role || 'Unknown',
          activityCount: u.activityCount,
          lastActivity: u.lastActivity,
        })),
        activityByRole: activityByRole.map(r => ({
          role: r.role,
          totalActivities: r.totalActivities,
          uniqueUsers: r.uniqueUsers,
        })),
      },
    });
  } catch (error) {
    console.error('Get user activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user activity statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Export activities to CSV
 * @route   GET /api/v1/analytics/activities/export
 * @access  Private - Admin only
 */
const exportActivities = async (req, res) => {
  try {
    const {
      section,
      actionType,
      status,
      actorRole,
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (section) filter.section = section;
    if (actionType) filter.actionType = actionType;
    if (status) {
      const statusMap = {
        success: 'SUCCESS',
        failure: 'FAILED',
        pending: 'PENDING',
        error: 'FAILED',
      };
      filter.status = statusMap[status.toLowerCase()] || status.toUpperCase();
    }
    if (actorRole) filter.actorRole = actorRole;
    
    if (startDate || endDate) {
      filter.activityTime = {};
      if (startDate) filter.activityTime.$gte = new Date(startDate);
      if (endDate) filter.activityTime.$lte = new Date(endDate);
    }

    const activities = await ActivityLog.find(filter)
      .populate('actorId', 'email role')
      .sort({ activityTime: -1 })
      .limit(10000) // Limit export to 10k records
      .lean();

    // Create CSV manually
    const headers = ['Time', 'Title', 'Description', 'Section', 'Action', 'Role', 'Actor', 'Status', 'IP', 'Device', 'Platform'];
    const rows = activities.map(activity => [
      new Date(activity.activityTime || activity.timestamp).toLocaleString(),
      activity.title || '',
      activity.description || '',
      activity.section || activity.module || '',
      activity.actionType || activity.action || '',
      activity.actorRole || activity.userRole || '',
      activity.actorEmail || activity.userEmail || 'System',
      activity.status || '',
      activity.ipAddress || '',
      activity.device || '',
      activity.platform || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting activities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Helper function to format date from aggregation group
 */
function formatDateFromGroup(group, groupBy) {
  if (groupBy === 'hour') {
    return `${group.year}-${String(group.month).padStart(2, '0')}-${String(group.day).padStart(2, '0')} ${String(group.hour).padStart(2, '0')}:00`;
  } else if (groupBy === 'week') {
    return `Week ${group.week}, ${group.year}`;
  } else {
    return `${group.year}-${String(group.month).padStart(2, '0')}-${String(group.day).padStart(2, '0')}`;
  }
}

module.exports = {
  getAnalyticsOverview,
  getActivityTrends,
  getFeatureUsage,
  getUsageHeatmap,
  getRecentActivities,
  getUserActivityStats,
  exportActivities,
};

