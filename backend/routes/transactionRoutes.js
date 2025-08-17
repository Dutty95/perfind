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
import { validateTransaction, validateObjectId, validatePagination, sanitizeInput, preventNoSQLInjection } from '../middleware/validationMiddleware.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';
import { apiRateLimit, modificationRateLimit } from '../middleware/rateLimitMiddleware.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

// All routes are protected and require CSRF protection
router.use(protect);
router.use(csrfProtection);
router.use(preventNoSQLInjection);

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', apiRateLimit, getTransactionStats);

// @route   GET /api/transactions/monthly
// @desc    Get monthly income vs expense data
// @access  Private
router.get('/monthly', apiRateLimit, getMonthlyData);

// @route   GET /api/transactions/categories
// @desc    Get category breakdown data
// @access  Private
router.get('/categories', apiRateLimit, getCategoryData);

// @route   GET /api/transactions
// @desc    Get all transactions for user
// @access  Private
router.get('/', apiRateLimit, validatePagination, sanitizeInput, auditMiddleware('TRANSACTION_VIEW', 'transaction'), getTransactions);

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', modificationRateLimit, validateTransaction, sanitizeInput, auditMiddleware('TRANSACTION_CREATE', 'transaction'), createTransaction);

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', apiRateLimit, validateObjectId, sanitizeInput, getTransaction);

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', modificationRateLimit, validateObjectId, validateTransaction, sanitizeInput, auditMiddleware('TRANSACTION_UPDATE', 'transaction'), updateTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', modificationRateLimit, validateObjectId, sanitizeInput, auditMiddleware('TRANSACTION_DELETE', 'transaction'), deleteTransaction);

export default router;