const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Activity ID (unique identifier)
  activityId: {
    type: String,
    unique: true,
    default: function () {
      return `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
  },

  // Human-readable title
  title: {
    type: String,
    required: true,
  },

  // Optional detailed description
  description: {
    type: String,
    default: null,
  },

  // Actor Information (who performed the action)
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  actorEmail: {
    type: String,
    default: null,
  },
  actorRole: {
    type: String,
    enum: ['admin', 'organization', 'merchant', 'donor', 'homeless', 'volunteer', 'system', null],
    default: null,
  },

  // Section/Module
  section: {
    type: String,
    required: true,
    enum: [
      'Authentication',
      'Organization Management',
      'Merchant Management',
      'Job Management',
      'Beneficiary Management',
      'Assignment',
      'Admin Panel',
      'Merchant Contributions',
      'Admin Management',
      'Payments',
      'System',
      'System Logs',
      'Notifications',
      'Job Assignment',
      'Dashboard',
      'Chat',
    ],
  },

  // Action Type
  actionType: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'REGISTER',
      'APPROVE',
      'REJECT',
      'ASSIGN',
      'BLOCK',
      'UNBLOCK',
      'ROLE_ASSIGN',
      'PAYMENT_INITIATED',
      'PAYMENT_SUCCESSFUL',
      'PAYMENT_FAILED',
      'NOTIFICATION_SENT',
      'BACKGROUND_JOB',
      'ERROR',
      'READ',
      'EXPORT',
      'IMPORT',
    ],
  },

  // Target Resource
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  targetType: {
    type: String,
    default: null, // e.g., 'Job', 'User', 'Homeless', 'Organization'
  },

  // Status
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS',
  },

  // Activity Time (ISO timestamp)
  activityTime: {
    type: Date,
    default: Date.now,
    index: true,
  },

  // IP Address
  ipAddress: {
    type: String,
    default: null,
  },

  // Device/Platform Information
  device: {
    type: String,
    default: null,
  },
  platform: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },

  // Additional Metadata (JSON)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Legacy fields for backward compatibility
  module: {
    type: String,
    default: null,
  },
  action: {
    type: String,
    default: null,
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', null],
    default: null,
  },
  endpoint: {
    type: String,
    default: null,
  },
  statusCode: {
    type: Number,
    default: null,
  },
  responseTime: {
    type: Number,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  errorStack: {
    type: String,
    default: null,
  },

  // Date fields for easy querying
  date: {
    type: String,
    index: true,
  },
  hour: {
    type: Number,
    default: null,
  },
  dayOfWeek: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for performance
activityLogSchema.index({ activityId: 1 });
activityLogSchema.index({ actorId: 1, activityTime: -1 });
activityLogSchema.index({ actorRole: 1, activityTime: -1 });
activityLogSchema.index({ section: 1, activityTime: -1 });
activityLogSchema.index({ actionType: 1, activityTime: -1 });
activityLogSchema.index({ status: 1, activityTime: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ date: 1, hour: 1 });
activityLogSchema.index({ activityTime: -1 });

// Pre-save hook to populate date fields
activityLogSchema.pre('save', function (next) {
  const date = this.activityTime || this.timestamp || new Date();
  const dateObj = new Date(date);
  this.date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  this.hour = dateObj.getHours();
  this.dayOfWeek = dateObj.getDay();

  // Set activityTime if not set
  if (!this.activityTime) {
    this.activityTime = dateObj;
  }

  // Populate legacy fields for backward compatibility
  if (!this.timestamp) {
    this.timestamp = dateObj;
  }

  next();
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

