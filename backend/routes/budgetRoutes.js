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
import { validateBudget, validateObjectId, validatePagination, sanitizeInput } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all budget routes
router.use(authMiddleware);

// GET /api/budgets - Get all budgets for authenticated user
router.get('/', getBudgets);

// GET /api/budgets/overview - Get budget overview/statistics
router.get('/overview', getBudgetOverview);

// GET /api/budgets/:id - Get single budget by ID
router.get('/:id', validateObjectId, getBudgetById);

// POST /api/budgets - Create new budget
router.post('/', sanitizeInput, validateBudget, createBudget);

// PUT /api/budgets/:id - Update budget
router.put('/:id', validateObjectId, sanitizeInput, validateBudget, updateBudget);

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', validateObjectId, deleteBudget);

export default router;