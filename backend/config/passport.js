import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token with refresh token
const generateTokens = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only if credentials are configured)


if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/google/callback`
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await User.findOrCreateOAuthUser(profile, 'google');
          
          // Generate our own JWT tokens
          const tokens = generateTokens(user._id);
          
          // Update user's refresh token
          await user.updateRefreshToken(tokens.refreshToken);
          
          // Attach tokens to user object
          user.tokens = tokens;
          
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Microsoft OAuth Strategy (only if credentials are configured)


if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_ID !== 'your_microsoft_client_id_here') {

  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/microsoft/callback`,
        scope: ['user.read']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await User.findOrCreateOAuthUser(profile, 'microsoft');
          
          // Generate our own JWT tokens
          const tokens = generateTokens(user._id);
          
          // Update user's refresh token
          await user.updateRefreshToken(tokens.refreshToken);
          
          // Attach tokens to user object
          user.tokens = tokens;
          
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

export default passport;
export { generateTokens };