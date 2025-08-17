// backend/routes/budgetRoutes.js

import express from 'express';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetOverview
} from '../controllers/budgetController.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';
import { validateBudget, validateObjectId, validatePagination, sanitizeInput, preventNoSQLInjection } from '../middleware/validationMiddleware.js';
import { apiRateLimit, modificationRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all budget routes
router.use(authMiddleware);
router.use(preventNoSQLInjection);

// GET /api/budgets - Get all budgets for authenticated user
router.get('/', apiRateLimit, getBudgets);

// GET /api/budgets/overview - Get budget overview/statistics
router.get('/overview', apiRateLimit, getBudgetOverview);

// GET /api/budgets/:id - Get single budget by ID
router.get('/:id', apiRateLimit, validateObjectId, getBudgetById);

// POST /api/budgets - Create new budget
router.post('/', modificationRateLimit, sanitizeInput, validateBudget, createBudget);

// PUT /api/budgets/:id - Update budget
router.put('/:id', modificationRateLimit, validateObjectId, sanitizeInput, validateBudget, updateBudget);

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', modificationRateLimit, validateObjectId, deleteBudget);

export default router;