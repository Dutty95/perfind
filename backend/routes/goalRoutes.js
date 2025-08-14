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
import { validateGoal, validateObjectId, validatePagination, sanitizeInput } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all goal routes
router.use(protect);

// @route   GET /api/goals/stats
// @desc    Get goal statistics
// @access  Private
router.get('/stats', getGoalStats);

// @route   GET /api/goals/overview
// @desc    Get goals overview for dashboard
// @access  Private
router.get('/overview', getGoalsOverview);

// @route   GET /api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', validatePagination, getGoals);

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', sanitizeInput, validateGoal, createGoal);

// @route   GET /api/goals/:id
// @desc    Get a single goal by ID
// @access  Private
router.get('/:id', validateObjectId, getGoalById);

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', validateObjectId, sanitizeInput, validateGoal, updateGoal);

// @route   PATCH /api/goals/:id/progress
// @desc    Update goal progress
// @access  Private
router.patch('/:id/progress', validateObjectId, sanitizeInput, updateGoalProgress);

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', validateObjectId, deleteGoal);

export default router;