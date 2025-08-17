// backend/routes/goalRoutes.js

import express from 'express';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  getGoalStats,
  getGoalsOverview
} from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateGoal, validateObjectId, validatePagination, sanitizeInput, validateGoalUpdate, preventNoSQLInjection } from '../middleware/validationMiddleware.js';
import { apiRateLimit, modificationRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all goal routes
router.use(protect);
router.use(preventNoSQLInjection);

// @route   GET /api/goals/stats
// @desc    Get goal statistics
// @access  Private
router.get('/stats', apiRateLimit, getGoalStats);

// @route   GET /api/goals/overview
// @desc    Get goals overview for dashboard
// @access  Private
router.get('/overview', apiRateLimit, getGoalsOverview);

// @route   GET /api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', apiRateLimit, validatePagination, getGoals);

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', modificationRateLimit, sanitizeInput, validateGoal, createGoal);

// @route   GET /api/goals/:id
// @desc    Get a single goal by ID
// @access  Private
router.get('/:id', apiRateLimit, validateObjectId, getGoalById);

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', modificationRateLimit, validateObjectId, sanitizeInput, validateGoalUpdate, updateGoal);

// @route   PATCH /api/goals/:id/progress
// @desc    Update goal progress
// @access  Private
router.patch('/:id/progress', modificationRateLimit, validateObjectId, sanitizeInput, updateGoalProgress);

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', modificationRateLimit, validateObjectId, deleteGoal);

export default router;