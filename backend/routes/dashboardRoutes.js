// backend/routes/dashboardRoutes.js
import express from 'express';
import {
  getDashboardOverview,
  getFinancialInsights,
  getSpendingTrends,
  getExpenseAnalytics,
  getIncomeAnalytics
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';
import { apiRateLimit } from '../middleware/rateLimitMiddleware.js';
import { preventNoSQLInjection } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard overview data
// @access  Private
router.get('/', apiRateLimit, preventNoSQLInjection, getDashboardOverview);

// @route   GET /api/dashboard/insights
// @desc    Get financial insights
// @access  Private
router.get('/insights', apiRateLimit, preventNoSQLInjection, getFinancialInsights);

// @route   GET /api/dashboard/trends
// @desc    Get spending trends
// @access  Private
router.get('/trends', apiRateLimit, preventNoSQLInjection, getSpendingTrends);

// @route   GET /api/dashboard/analytics/expenses
// @desc    Get expense analytics
// @access  Private
router.get('/analytics/expenses', apiRateLimit, preventNoSQLInjection, getExpenseAnalytics);

// @route   GET /api/dashboard/analytics/income
// @desc    Get income analytics
// @access  Private
router.get('/analytics/income', apiRateLimit, preventNoSQLInjection, getIncomeAnalytics);

export default router;