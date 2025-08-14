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

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard overview data
// @access  Private
router.get('/', getDashboardOverview);

// @route   GET /api/dashboard/insights
// @desc    Get financial insights and recommendations
// @access  Private
router.get('/insights', getFinancialInsights);

// @route   GET /api/dashboard/trends
// @desc    Get spending trends over time
// @access  Private
router.get('/trends', getSpendingTrends);

// @route   GET /api/dashboard/analytics/expenses
// @desc    Get expense analytics data
// @access  Private
router.get('/analytics/expenses', getExpenseAnalytics);

// @route   GET /api/dashboard/analytics/income
// @desc    Get income analytics data
// @access  Private
router.get('/analytics/income', getIncomeAnalytics);

export default router;