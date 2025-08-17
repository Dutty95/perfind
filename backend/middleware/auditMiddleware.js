import AuditLog from '../models/AuditLog.js';

// Helper function to get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         'unknown';
};

// Helper function to determine severity based on action
const getSeverity = (action) => {
  const highSeverityActions = [
    'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'UNAUTHORIZED_ACCESS', 
    'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED'
  ];
  const mediumSeverityActions = [
    'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'TRANSACTION_DELETE',
    'BUDGET_DELETE', 'GOAL_DELETE', 'SETTINGS_CHANGE'
  ];
  
  if (highSeverityActions.includes(action)) return 'HIGH';
  if (mediumSeverityActions.includes(action)) return 'MEDIUM';
  return 'LOW';
};

// Main audit logging function
export const auditLog = async (userId, action, resource, options = {}) => {
  try {
    const {
      resourceId,
      details,
      ipAddress,
      userAgent,
      sessionId,
      success = true,
      errorMessage,
      metadata = {}
    } = options;

    const auditData = {
      userId,
      action,
      resource,
      resourceId,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      sessionId,
      success,
      errorMessage,
      metadata,
      severity: getSeverity(action)
    };

    await AuditLog.logEvent(auditData);
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw to avoid breaking main application flow
  }
};

// Middleware to automatically log API requests
export const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();
    
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      const success = res.statusCode < 400;
      
      // Log the audit event
      const userId = req.user?.id || req.user?._id || 'anonymous';
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const sessionId = req.sessionID;
      
      const details = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        body: req.method !== 'GET' ? 'redacted' : undefined
      };
      
      auditLog(userId, action, resource, {
        resourceId: req.params.id,
        details,
        ipAddress,
        userAgent,
        sessionId,
        success,
        errorMessage: success ? undefined : 'Request failed'
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware for authentication events
export const auditAuth = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const success = res.statusCode < 400;
      const userId = req.user?.id || req.user?._id || null;
      
      auditLog(userId, action, 'auth', {
        details: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode
        },
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'],
        sessionId: req.sessionID,
        success,
        errorMessage: success ? undefined : 'Authentication failed'
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware for suspicious activity detection
export const detectSuspiciousActivity = async (req, res, next) => {
  const ipAddress = getClientIP(req);
  const userAgent = req.headers['user-agent'];
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot|crawler|spider/i.test(userAgent),
    req.headers['x-forwarded-for']?.split(',').length > 3, // Multiple proxies
    !userAgent || userAgent.length < 10, // Missing or very short user agent
  ];
  
  if (suspiciousPatterns.some(pattern => pattern)) {
    await auditLog(
      req.user?.id || 'anonymous',
      'SUSPICIOUS_ACTIVITY',
      'security',
      {
        details: {
          reason: 'Suspicious user agent or IP pattern',
          userAgent,
          ipAddress,
          url: req.originalUrl
        },
        ipAddress,
        userAgent,
        sessionId: req.sessionID,
        success: false,
        metadata: { automated: true }
      }
    );
  }
  
  next();
};