import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt } from '../config/encryption.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    set: encrypt,  // Encrypt on save
    get: decrypt   // Decrypt on retrieval
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    set: encrypt,  // Encrypt on save
    get: decrypt   // Decrypt on retrieval
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
    minlength: 6,
    select: false
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'microsoft'],
    default: 'local'
  },
  providerId: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  }],
  // Legacy field for backward compatibility
  refreshToken: {
    type: String,
    default: null,
    select: false
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Ensure getters are applied when converting to JSON
userSchema.set('toJSON', { 
  getters: true,
  transform: function(doc, ret) {
    // Ensure sensitive fields are properly decrypted for JSON output
    if (ret.name && typeof ret.name === 'string' && ret.name.includes(':')) {
      ret.name = decrypt(ret.name);
    }
    if (ret.email && typeof ret.email === 'string' && ret.email.includes(':')) {
      ret.email = decrypt(ret.email);
    }
    return ret;
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Use higher salt rounds for better security (12 rounds)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Change password method with validation
userSchema.methods.changePassword = async function(currentPassword, newPassword) {
  // Verify current password
  const isMatch = await this.matchPassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }
  
  // Check if new password is different from current
  const isSamePassword = await bcrypt.compare(newPassword, this.password);
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }
  
  // Set new password (will be hashed by pre-save hook)
  this.password = newPassword;
  return await this.save();
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate random token
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Reset password using token
userSchema.methods.resetPassword = async function(token, newPassword) {
  // Hash the provided token
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Check if token matches and hasn't expired
  if (this.resetPasswordToken !== hashedToken) {
    throw new Error('Invalid reset token');
  }
  
  if (this.resetPasswordExpire < Date.now()) {
    throw new Error('Reset token has expired');
  }
  
  // Set new password (will be hashed by pre-save hook)
  this.password = newPassword;
  this.resetPasswordToken = null;
  this.resetPasswordExpire = null;
  
  return await this.save();
};

// Update refresh token method (legacy - for backward compatibility)
userSchema.methods.updateRefreshToken = async function(refreshToken) {
  this.refreshToken = refreshToken;
  return await this.save();
};

// Add new refresh token with rotation
userSchema.methods.addRefreshToken = async function(refreshToken, expiresIn = 7 * 24 * 60 * 60 * 1000) {
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter(token => 
    token.expiresAt > new Date() && !token.isRevoked
  );
  
  // Limit to maximum 5 active refresh tokens per user
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest token
  }
  
  // Add new refresh token
  this.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + expiresIn)
  });
  
  // Also update legacy field for backward compatibility
  this.refreshToken = refreshToken;
  
  return await this.save();
};

// Validate refresh token
userSchema.methods.validateRefreshToken = function(refreshToken) {
  const tokenRecord = this.refreshTokens.find(token => 
    token.token === refreshToken && 
    token.expiresAt > new Date() && 
    !token.isRevoked
  );
  return !!tokenRecord;
};

// Revoke refresh token
userSchema.methods.revokeRefreshToken = async function(refreshToken) {
  const tokenRecord = this.refreshTokens.find(token => token.token === refreshToken);
  if (tokenRecord) {
    tokenRecord.isRevoked = true;
  }
  
  // Also clear legacy field if it matches
  if (this.refreshToken === refreshToken) {
    this.refreshToken = null;
  }
  
  return await this.save();
};

// Revoke all refresh tokens (for logout from all devices)
userSchema.methods.revokeAllRefreshTokens = async function() {
  this.refreshTokens.forEach(token => {
    token.isRevoked = true;
  });
  this.refreshToken = null;
  return await this.save();
};

// Clean up expired tokens (should be called periodically)
userSchema.methods.cleanupExpiredTokens = async function() {
  const initialCount = this.refreshTokens.length;
  this.refreshTokens = this.refreshTokens.filter(token => 
    token.expiresAt > new Date() && !token.isRevoked
  );
  
  if (this.refreshTokens.length !== initialCount) {
    return await this.save();
  }
  return this;
};

// Static method to find user by email (handles encryption)
userSchema.statics.findByEmail = async function(email) {
  // Since email is encrypted, we need to search through all users
  // This is not ideal for performance but necessary with field-level encryption
  const users = await this.find({}).select('+password');
  
  for (const user of users) {
    if (user.email === email.toLowerCase()) {
      return user;
    }
  }
  
  return null;
};

// Static method to find or create OAuth user
userSchema.statics.findOrCreateOAuthUser = async function(profile, provider) {
  // First try to find by provider ID
  let user = await this.findOne({ providerId: profile.id, provider: provider });
  
  if (user) {
    return user;
  }

  // Extract email from profile (handle different OAuth providers)
  let email;
  if (profile.emails && profile.emails.length > 0) {
    email = profile.emails[0].value;
  } else if (profile.email) {
    email = profile.email;
  } else if (profile._json && profile._json.email) {
    email = profile._json.email;
  } else if (profile._json && profile._json.userPrincipalName) {
    // Microsoft specific - userPrincipalName is often the email
    email = profile._json.userPrincipalName;
  }

  if (!email) {
    throw new Error('No email found in OAuth profile');
  }

  // Then try to find by email using our custom method
  user = await this.findByEmail(email);
  
  if (user) {
    // Update existing user with OAuth info
    user.provider = provider;
    user.providerId = profile.id;
    user.avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
    return await user.save();
  }

  // Create new user
  const userData = {
    name: profile.displayName || (profile.name?.givenName + ' ' + profile.name?.familyName) || profile._json?.displayName || 'User',
    email: email,
    provider: provider,
    providerId: profile.id,
    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
  };

  const newUser = new this(userData);
  return await newUser.save();
};

const User = mongoose.model('User', userSchema);

export default User;