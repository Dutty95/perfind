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

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
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

// Goal validation rules for creation
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
  body('type')
    .isIn(['save', 'reduce', 'earn', 'invest'])
    .withMessage('Type must be one of: save, reduce, earn, invest'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .escape(),
  body('targetAmount')
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Target amount must be a positive number between 0.01 and 999,999,999'),
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be in valid ISO format'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringPeriod')
    .if(body('isRecurring').equals(true))
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Recurring period must be weekly, monthly, or yearly when isRecurring is true'),
  handleValidationErrors
];

// Goal validation rules for updates (all fields optional)
export const validateGoalUpdate = [
  body('title')
    .optional()
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
  body('type')
    .optional()
    .isIn(['save', 'reduce', 'earn', 'invest'])
    .withMessage('Type must be one of: save, reduce, earn, invest'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .escape(),
  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Target amount must be a positive number between 0.01 and 999,999,999'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be in valid ISO format'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0, max: 999999999 })
    .withMessage('Current amount must be a non-negative number'),
  body('status')
    .optional()
    .isIn(['active', 'paused', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, paused, completed, cancelled'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringPeriod')
    .optional()
    .if(body('isRecurring').equals(true))
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Recurring period must be weekly, monthly, or yearly when isRecurring is true'),
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
export const validateIdParam = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query parameter validation
export const validatePaginationParams = [
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

// Enhanced sanitize user input
export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      // Remove script tags and content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove iframe tags and content
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      // Remove object and embed tags
      .replace(/<(object|embed)[^>]*>[\s\S]*?<\/(object|embed)>/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove vbscript: protocol
      .replace(/vbscript:/gi, '')
      // Remove data: protocol (except for safe data URLs)
      .replace(/data:(?!image\/(png|jpg|jpeg|gif|svg\+xml|webp))[^;,]*[;,]/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove style attributes that could contain expressions
      .replace(/style\s*=\s*["'][^"']*expression[^"']*["']/gi, '')
      // Remove potentially dangerous HTML tags
      .replace(/<(link|meta|base|form|input|button|textarea|select|option)[^>]*>/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize key names to prevent prototype pollution
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_$]/g, '');
        if (sanitizedKey && sanitizedKey !== '__proto__' && sanitizedKey !== 'constructor' && sanitizedKey !== 'prototype') {
          sanitized[sanitizedKey] = sanitizeObject(obj[key]);
        }
      }
    }
    return sanitized;
  };
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Additional validation utilities
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100'),
  query('sort')
    .optional()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('Sort field contains invalid characters'),
  query('order')
    .optional()
    .isIn(['asc', 'desc', '1', '-1'])
    .withMessage('Order must be asc, desc, 1, or -1'),
  handleValidationErrors
];

// Prevent NoSQL injection
export const preventNoSQLInjection = (req, res, next) => {
  const checkForInjection = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          return true;
        }
        if (typeof obj[key] === 'object' && checkForInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };
  
  if (checkForInjection(req.body) || checkForInjection(req.query) || checkForInjection(req.params)) {
    return res.status(400).json({ message: 'Invalid request format' });
  }
  
  next();
};