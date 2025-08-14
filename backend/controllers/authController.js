import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passport from '../config/passport.js';
import { generateTokens } from '../config/passport.js';

// Generate JWT Token (legacy - keeping for backward compatibility)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production', {
    expiresIn: '30d'
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
      
      // Update user's refresh token
      await user.updateRefreshToken(tokens.refreshToken);
      
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
    // Find user by email and include password in the result
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Generate new token format
      const tokens = generateTokens(user._id);
      
      // Update user's refresh token
      await user.updateRefreshToken(tokens.refreshToken);
      
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

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
    }

    // TODO: Implement actual password reset token generation and email sending
    // For now, just log it
    console.log(`Sending reset link to: ${email}`);

    return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = (req, res) => {
  const user = req.user;
  if (user && user.tokens) {
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', user.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to frontend with access token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?token=${user.tokens.accessToken}`);
  } else {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error`);
  }
};

// @desc    Microsoft OAuth callback
// @route   GET /api/auth/microsoft/callback
// @access  Public
export const microsoftCallback = (req, res) => {
  const user = req.user;
  if (user && user.tokens) {
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', user.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to frontend with access token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?token=${user.tokens.accessToken}`);
  } else {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error`);
  }
};

// @desc    Refresh access token
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
    if (!user || user.refreshToken !== clientRefreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Update user's refresh token
    await user.updateRefreshToken(tokens.refreshToken);
    
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
    const user = await User.findById(req.user.id);
    if (user) {
      // Clear refresh token
      await user.updateRefreshToken(null);
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};
