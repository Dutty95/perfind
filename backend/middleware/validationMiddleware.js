import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Auth validation rules
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Transaction validation rules
export const validateTransaction = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters')
    .escape(),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Amount must be a positive number between 0.01 and 999,999,999'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .escape(),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in valid ISO format'),
  handleValidationErrors
];

// Budget validation rules
export const validateBudget = [
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .escape(),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Amount must be a positive number between 0.01 and 999,999,999'),
  body('period')
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be weekly, monthly, or yearly'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in valid ISO format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in valid ISO format'),
  handleValidationErrors
];

// Goal validation rules
export const validateGoal = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .escape(),
  body('targetAmount')
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Target amount must be a positive number between 0.01 and 999,999,999'),
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be in valid ISO format'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters')
    .escape(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  handleValidationErrors
];

// Report validation rules
export const validateReport = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .escape(),
  body('type')
    .isIn(['income', 'expense', 'budget', 'goal', 'comprehensive', 'custom'])
    .withMessage('Invalid report type'),
  body('period')
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
    .withMessage('Invalid period'),
  body('startDate')
    .if(body('period').equals('custom'))
    .isISO8601()
    .withMessage('Start date is required for custom period'),
  body('endDate')
    .if(body('period').equals('custom'))
    .isISO8601()
    .withMessage('End date is required for custom period'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each category must be between 1 and 50 characters')
    .escape(),
  handleValidationErrors
];

// ID parameter validation
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query parameter validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100'),
  handleValidationErrors
];

// Sanitize user input
export const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts from request body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove script tags and other potentially dangerous content
        req.body[key] = req.body[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  next();
};