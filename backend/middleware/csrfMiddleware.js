import csrf from 'csrf';
import asyncHandler from 'express-async-handler';

// Create CSRF instance
const tokens = new csrf();

// Generate CSRF secret for the session
const generateSecret = () => {
  return tokens.secretSync();
};

// Generate CSRF token
const generateToken = (secret) => {
  return tokens.create(secret);
};

// Verify CSRF token
const verifyToken = (secret, token) => {
  return tokens.verify(secret, token);
};

// Middleware to generate and attach CSRF token to response
const csrfProtection = asyncHandler(async (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Generate secret if not exists in session
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = generateSecret();
  }

  // For state-changing operations, verify CSRF token
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing'
    });
  }

  if (!verifyToken(req.session.csrfSecret, token)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
});

// Middleware to provide CSRF token to client
const provideCsrfToken = asyncHandler(async (req, res, next) => {
  // Generate secret if not exists
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = generateSecret();
  }

  // Generate token and attach to response
  const token = generateToken(req.session.csrfSecret);
  res.locals.csrfToken = token;
  
  // Also set in header for API responses
  res.set('X-CSRF-Token', token);
  
  next();
});

// Route to get CSRF token
const getCsrfToken = asyncHandler(async (req, res) => {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = generateSecret();
  }

  const token = generateToken(req.session.csrfSecret);
  
  res.json({
    success: true,
    csrfToken: token
  });
});

export { csrfProtection, provideCsrfToken, getCsrfToken };