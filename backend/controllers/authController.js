import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passport from '../config/passport.js';
import { generateTokens } from '../config/passport.js';

// Generate JWT Token (legacy - keeping for backward compatibility)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production', {
    expiresIn: '2h'
  });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_do_not_use_in_production');
  } catch (error) {
    return null;
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  console.log('Registration attempt:', { name, email, passwordLength: password?.length });

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Creating new user...');
    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });
    console.log('User created successfully:', user._id);

    if (user) {
      // Generate new token format
      const tokens = generateTokens(user._id);
      
      // Add new refresh token with rotation
      await user.addRefreshToken(tokens.refreshToken);
      
      // Set refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email using custom method that handles encryption
    const user = await User.findByEmail(email);

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Generate new token format
      const tokens = generateTokens(user._id);
      
      // Add new refresh token with rotation
      await user.addRefreshToken(tokens.refreshToken);
      
      // Set refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send email with reset token
    // For development, log the reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);

    return res.status(200).json({ 
      message: 'If a user with that email exists, a reset link has been sent.',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find user with valid reset token
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Reset password using the model method
    await user.resetPassword(token, newPassword);

    // Revoke all refresh tokens for security
    await user.revokeAllRefreshTokens();

    console.log(`Password reset successful for user: ${user.email}`);

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    if (err.message === 'Invalid reset token' || err.message === 'Reset token has expired') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Change password using the model method
    await user.changePassword(currentPassword, newPassword);

    // Revoke all refresh tokens except current one for security
    const currentRefreshToken = req.cookies.refreshToken;
    await user.revokeAllRefreshTokens();
    
    // Re-add current refresh token if it exists
    if (currentRefreshToken) {
      const decoded = verifyRefreshToken(currentRefreshToken);
      if (decoded) {
        await user.addRefreshToken(currentRefreshToken);
      }
    }

    console.log(`Password changed successfully for user: ${user.email}`);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    if (err.message === 'Current password is incorrect' || err.message === 'New password must be different from current password') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Something went wrong' });
   }
 };

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  const user = req.user;
  if (user && user.tokens) {
    try {
      // Add refresh token with rotation
      await user.addRefreshToken(user.tokens.refreshToken);
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', user.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Redirect to frontend with access token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?token=${user.tokens.accessToken}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error`);
    }
  } else {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error`);
  }
};

// @desc    Microsoft OAuth callback
// @route   GET /api/auth/microsoft/callback
// @access  Public
export const microsoftCallback = async (req, res) => {
  const user = req.user;
  if (user && user.tokens) {
    try {
      // Add refresh token with rotation
      await user.addRefreshToken(user.tokens.refreshToken);
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', user.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Redirect to frontend with access token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?token=${user.tokens.accessToken}`);
    } catch (error) {
      console.error('Microsoft OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error`);
    }
  } else {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error`);
  }
};

// @desc    Refresh access token with token rotation
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: clientRefreshToken } = req.cookies;
    
    if (!clientRefreshToken) {
      return res.status(401).json({ message: 'Refresh token not provided' });
    }
    
    const decoded = verifyRefreshToken(clientRefreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Validate refresh token using new method
    if (!user.validateRefreshToken(clientRefreshToken)) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    
    // Revoke the old refresh token
    await user.revokeRefreshToken(clientRefreshToken);
    
    // Generate new tokens (token rotation)
    const tokens = generateTokens(user._id);
    
    // Add new refresh token
    await user.addRefreshToken(tokens.refreshToken);
    
    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      accessToken: tokens.accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const { refreshToken: clientRefreshToken } = req.cookies;
    const user = await User.findById(req.user.id);
    
    if (user) {
      if (clientRefreshToken) {
        // Revoke specific refresh token
        await user.revokeRefreshToken(clientRefreshToken);
      } else {
        // If no specific token, revoke all tokens (logout from all devices)
        await user.revokeAllRefreshTokens();
      }
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      // Revoke all refresh tokens
      await user.revokeAllRefreshTokens();
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Server error during logout from all devices' });
  }
};
