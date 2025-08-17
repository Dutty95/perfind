import helmet from 'helmet';

// Enhanced security headers middleware
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Allow inline styles for React
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for development builds
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL || "http://localhost:5173",
        "https://api.exchangerate-api.com", // For currency conversion if used
        "wss://localhost:*" // WebSocket connections for development
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    },
    reportOnly: process.env.NODE_ENV === 'development' // Only report in development
  },
  
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,
  
  // X-Download-Options
  ieNoOpen: true,
  
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false
  },
  
  // Disable X-Powered-By header
  hidePoweredBy: true,
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for compatibility
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
});

// Enhanced CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000', // Alternative React dev server
      'http://localhost:5000', // Alternative dev server
      'http://localhost:5174', // Current Vite dev server
    ];
    
    // Add Netlify domains if FRONTEND_URL is set
    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('netlify.app')) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    } else {
      // In development, be more permissive but still validate
      if (origin.startsWith('http://localhost:') || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24 hours
};

// Additional security middleware
export const additionalSecurity = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent Adobe Flash and PDF files from including content from your site
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Prevent IE from executing downloads in your site's context
  res.setHeader('X-Download-Options', 'noopen');
  
  // Control DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  
  // Feature Policy / Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  
  next();
};