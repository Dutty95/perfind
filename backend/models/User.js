import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true
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
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update refresh token method
userSchema.methods.updateRefreshToken = async function(refreshToken) {
  this.refreshToken = refreshToken;
  return await this.save();
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

  // Then try to find by email
  user = await this.findOne({ email: email.toLowerCase() });
  
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