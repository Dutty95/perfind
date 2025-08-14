import express from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getMonthlyData,
  getCategoryData
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateTransaction, validateObjectId, validatePagination, sanitizeInput } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', getTransactionStats);

// @route   GET /api/transactions/monthly
// @desc    Get monthly income vs expense data
// @access  Private
router.get('/monthly', getMonthlyData);

// @route   GET /api/transactions/categories
// @desc    Get category breakdown data
// @access  Private
router.get('/categories', getCategoryData);

// @route   GET /api/transactions
// @desc    Get all transactions for user
// @access  Private
router.get('/', getTransactions);

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', sanitizeInput, validateTransaction, createTransaction);

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', validateObjectId, getTransaction);

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', validateObjectId, sanitizeInput, validateTransaction, updateTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', validateObjectId, deleteTransaction);

export default router;