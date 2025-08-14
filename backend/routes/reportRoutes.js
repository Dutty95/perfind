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
import { validateReport, validateObjectId, validatePagination, sanitizeInput } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all report routes
router.use(protect);

// @route   GET /api/reports/templates
// @desc    Get report templates/presets
// @access  Private
router.get('/templates', getReportTemplates);

// @route   GET /api/reports/summary
// @desc    Get quick financial summary
// @access  Private
router.get('/summary', getQuickSummary);

// @route   POST /api/reports/generate
// @desc    Generate a new report
// @access  Private
router.post('/generate', sanitizeInput, validateReport, generateReport);

// @route   GET /api/reports
// @desc    Get all reports for a user
// @access  Private
router.get('/', validatePagination, getReports);

// @route   GET /api/reports/:id
// @desc    Get a single report by ID
// @access  Private
router.get('/:id', validateObjectId, getReportById);

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', validateObjectId, deleteReport);

export default router;