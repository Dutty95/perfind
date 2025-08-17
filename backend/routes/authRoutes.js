import express from 'express';
import { register, login, getUserProfile, forgotPassword, resetPassword, changePassword, googleCallback, microsoftCallback, refreshToken, logout, logoutAll } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateChangePassword, sanitizeInput, preventNoSQLInjection } from '../middleware/validationMiddleware.js';
import { getCsrfToken, csrfProtection } from '../middleware/csrfMiddleware.js';
import { authRateLimit, passwordResetRateLimit } from '../middleware/rateLimitMiddleware.js';
import { auditAuth } from '../middleware/auditMiddleware.js';
import passport from '../config/passport.js';

const router = express.Router();

// Public routes - no CSRF protection needed for initial auth
router.post('/register', authRateLimit, preventNoSQLInjection, sanitizeInput, validateRegister, auditAuth('REGISTER'), register);
router.post('/login', authRateLimit, preventNoSQLInjection, sanitizeInput, validateLogin, auditAuth('LOGIN_SUCCESS'), login);
router.post('/forgot-password', passwordResetRateLimit, preventNoSQLInjection, sanitizeInput, validateForgotPassword, forgotPassword);
router.post('/reset-password', passwordResetRateLimit, preventNoSQLInjection, sanitizeInput, validateResetPassword, resetPassword);
router.post('/refresh', authRateLimit, refreshToken); // No CSRF for refresh token

// OAuth routes - only register if credentials are configured
// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth/error' }), googleCallback);
}

// Microsoft OAuth
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_ID !== 'your_microsoft_client_id_here') {
  router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
  router.get('/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/auth/error' }), microsoftCallback);
}



// CSRF token endpoint
router.get('/csrf-token', getCsrfToken);

// Protected routes
router.get('/profile', protect, preventNoSQLInjection, getUserProfile);
router.post('/change-password', protect, csrfProtection, preventNoSQLInjection, sanitizeInput, validateChangePassword, auditAuth('PASSWORD_CHANGE'), changePassword);
router.post('/logout', protect, csrfProtection, preventNoSQLInjection, auditAuth('LOGOUT'), logout);
router.post('/logout-all', protect, csrfProtection, preventNoSQLInjection, logoutAll);

export default router;
