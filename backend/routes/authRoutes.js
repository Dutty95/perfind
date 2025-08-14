import express from 'express';
import { register, login, getUserProfile, forgotPassword, googleCallback, microsoftCallback, refreshToken, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin, sanitizeInput } from '../middleware/validationMiddleware.js';
import { getCsrfToken, csrfProtection } from '../middleware/csrfMiddleware.js';
import passport from '../config/passport.js';

const router = express.Router();

// Public routes
router.get('/csrf-token', getCsrfToken);
router.post('/register', sanitizeInput, validateRegister, csrfProtection, register);
router.post('/login', sanitizeInput, validateLogin, csrfProtection, login);
router.post('/forgot-password', csrfProtection, forgotPassword);
router.post('/refresh', refreshToken); // No CSRF for refresh token

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



// Protected routes
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, csrfProtection, logout);

export default router;
