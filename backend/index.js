import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { provideCsrfToken, getCsrfToken, csrfProtection } from './middleware/csrfMiddleware.js';
import { globalErrorHandler, notFound } from './middleware/errorMiddleware.js';
import { securityHeaders, corsOptions, additionalSecurity } from './middleware/securityMiddleware.js';
import connectDB from './config/database.js';

// Load environment variables FIRST
dotenv.config();

// Import passport and routes after env vars are loaded
const { default: passport } = await import('./config/passport.js');
const { default: authRoutes } = await import('./routes/authRoutes.js');
const { default: transactionRoutes } = await import('./routes/transactionRoutes.js');
const { default: budgetRoutes } = await import('./routes/budgetRoutes.js');
const { default: dashboardRoutes } = await import('./routes/dashboardRoutes.js');
const { default: goalRoutes } = await import('./routes/goalRoutes.js');
const { default: reportRoutes } = await import('./routes/reportRoutes.js');
// Add this import
const { default: auditRoutes } = await import('./routes/auditRoutes.js');
import { detectSuspiciousActivity } from './middleware/auditMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB().catch(error => {
  console.error('Failed to connect to database:', error.message);
  console.log('Exiting application due to database connection failure');
  process.exit(1);
});

// Enhanced Security middleware (must be first)
app.use(securityHeaders);
app.use(additionalSecurity);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // increased limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for CSRF token endpoint
    return req.path === '/api/csrf-token';
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth requests per windowMs (increased for development)
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// Enhanced CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));
app.use(cookieParser());

// Session configuration (must come before CSRF)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  name: 'sessionId' // Don't use default session name
}));

// Provide CSRF token for all requests (after session)
app.use(provideCsrfToken);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Routes with CSRF protection for state-changing operations
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', csrfProtection, transactionRoutes);
app.use('/api/budgets', csrfProtection, budgetRoutes);
app.use('/api/dashboard', dashboardRoutes); // Read-only, no CSRF needed
app.use('/api/goals', csrfProtection, goalRoutes);
app.use('/api/reports', csrfProtection, reportRoutes);

// Add suspicious activity detection middleware
app.use(detectSuspiciousActivity);

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Personal Finance API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    security: {
      headers: 'enabled',
      cors: 'configured',
      csrf: 'enabled',
      rateLimit: 'enabled'
    }
  });
});

// 404 handler for undefined routes
app.use('*', notFound);

// Global error handling middleware
app.use(globalErrorHandler);

// Add audit routes
app.use('/api/audit', auditRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Security features enabled:');
  console.log('✓ Enhanced Security Headers (CSP, HSTS, XSS Protection)');
  console.log('✓ CORS Protection');
  console.log('✓ Rate Limiting');
  console.log('✓ CSRF Protection');
  console.log('✓ Data Encryption');
});





