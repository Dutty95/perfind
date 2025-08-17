import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Get user's audit logs
router.get('/my-logs', 
  protect,
  auditMiddleware('AUDIT_VIEW', 'audit'),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, action, startDate, endDate } = req.query;
      
      const query = { userId: req.user.id };
      
      if (action) query.action = action;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-__v');
      
      const total = await AuditLog.countDocuments(query);
      
      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

// Get security summary
router.get('/security-summary',
  protect,
  auditMiddleware('SECURITY_SUMMARY_VIEW', 'audit'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const [recentActivity, failedLogins, suspiciousActivity] = await Promise.all([
        AuditLog.countDocuments({ userId, createdAt: { $gte: last30Days } }),
        AuditLog.countDocuments({ 
          userId, 
          action: 'LOGIN_FAILED', 
          createdAt: { $gte: last30Days } 
        }),
        AuditLog.countDocuments({ 
          userId, 
          severity: { $in: ['HIGH', 'CRITICAL'] }, 
          createdAt: { $gte: last30Days } 
        })
      ]);
      
      res.json({
        summary: {
          recentActivity,
          failedLogins,
          suspiciousActivity,
          period: '30 days'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch security summary' });
    }
  }
);

export default router;