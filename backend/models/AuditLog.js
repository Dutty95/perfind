import mongoose from 'mongoose';
import { encrypt, decrypt } from '../config/encryption.js';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET_SUCCESS',
      'ACCOUNT_LOCKED',
      'TOKEN_REFRESH',
      
      // Transaction events
      'TRANSACTION_CREATE',
      'TRANSACTION_UPDATE',
      'TRANSACTION_DELETE',
      'TRANSACTION_VIEW',
      
      // Budget events
      'BUDGET_CREATE',
      'BUDGET_UPDATE',
      'BUDGET_DELETE',
      'BUDGET_VIEW',
      
      // Goal events
      'GOAL_CREATE',
      'GOAL_UPDATE',
      'GOAL_DELETE',
      'GOAL_COMPLETE',
      'GOAL_VIEW',
      
      // Profile events
      'PROFILE_UPDATE',
      'PROFILE_VIEW',
      
      // Security events
      'SUSPICIOUS_ACTIVITY',
      'RATE_LIMIT_EXCEEDED',
      'UNAUTHORIZED_ACCESS',
      'DATA_EXPORT',
      'SETTINGS_CHANGE'
    ]
  },
  resource: {
    type: String,
    required: true // e.g., 'transaction', 'budget', 'goal', 'user'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Not all actions have a specific resource ID
  },
  details: {
    type: String,
    set: encrypt,
    get: decrypt
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: false
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    set: encrypt,
    get: decrypt
  },
  metadata: {
    type: Map,
    of: String,
    default: new Map()
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ success: 1, createdAt: -1 });

// Ensure virtual fields are serialized
auditLogSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Ensure encrypted fields are properly decrypted for JSON output
    if (ret.details) {
      ret.details = ret.details;
    }
    if (ret.errorMessage) {
      ret.errorMessage = ret.errorMessage;
    }
    return ret;
  }
});

// Static methods
auditLogSchema.statics.logEvent = async function(eventData) {
  try {
    const auditLog = new this(eventData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main application flow
  }
};

auditLogSchema.statics.findByUserId = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

auditLogSchema.statics.findSuspiciousActivity = async function(timeWindow = 24) {
  const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
  return this.find({
    createdAt: { $gte: since },
    $or: [
      { success: false },
      { severity: { $in: ['HIGH', 'CRITICAL'] } },
      { action: { $in: ['SUSPICIOUS_ACTIVITY', 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_EXCEEDED'] } }
    ]
  }).sort({ createdAt: -1 });
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;