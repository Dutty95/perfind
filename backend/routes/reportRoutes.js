// backend/routes/reportRoutes.js

import express from 'express';
import {
  generateReport,
  getReports,
  getReportById,
  deleteReport,
  getReportTemplates,
  getQuickSummary
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateReport, validateObjectId, validatePagination, sanitizeInput, preventNoSQLInjection } from '../middleware/validationMiddleware.js';
import { apiRateLimit, modificationRateLimit, reportRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all report routes
router.use(protect);
router.use(preventNoSQLInjection);

// @route   GET /api/reports/templates
// @desc    Get report templates/presets
// @access  Private
router.get('/templates', apiRateLimit, getReportTemplates);

// @route   GET /api/reports/summary
// @desc    Get quick financial summary
// @access  Private
router.get('/summary', apiRateLimit, getQuickSummary);

// @route   POST /api/reports/generate
// @desc    Generate a new report
// @access  Private
router.post('/generate', reportRateLimit, sanitizeInput, validateReport, generateReport);

// @route   GET /api/reports
// @desc    Get all reports for a user
// @access  Private
router.get('/', apiRateLimit, validatePagination, getReports);

// @route   GET /api/reports/:id
// @desc    Get a single report by ID
// @access  Private
router.get('/:id', apiRateLimit, validateObjectId, getReportById);

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', modificationRateLimit, validateObjectId, deleteReport);

export default router;