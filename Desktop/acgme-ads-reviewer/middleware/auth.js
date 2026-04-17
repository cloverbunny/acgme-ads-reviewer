/**
 * Authentication Middleware
 * Provides JWT and API key authentication
 */

import crypto from 'crypto';

/**
 * Simple API Key authentication
 * For development and simple deployments
 */
export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required'
    });
  }

  // In production, validate against stored keys in database
  // For now, check against environment variable
  const validKey = process.env.API_KEY;

  if (apiKey !== validKey) {
    return res.status(403).json({
      error: 'Invalid API key'
    });
  }

  next();
};

/**
 * JWT token authentication
 * For more sophisticated deployments
 */
export const jwtAuth = (req, res, next) => {
  // TODO: Implement JWT verification
  // This requires 'jsonwebtoken' package
  
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token required'
    });
  }

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      error: 'Invalid token'
    });
  }
};

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP
 */
export const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    // Clean old requests outside window
    const userRequests = requests.get(ip).filter(time => now - time < windowMs);
    requests.set(ip, userRequests);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }

    userRequests.push(now);
    next();
  };
};

/**
 * CORS validation middleware
 * Ensures requests come from allowed origins
 */
export const validateCORS = (allowedOrigins = []) => {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    next();
  };
};

/**
 * Request validation middleware
 * Validates request body against schema
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Basic validation - extend with more robust validation library
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];

        if (rules.required && !value) {
          return res.status(400).json({
            error: `${field} is required`
          });
        }

        if (value && rules.type) {
          if (typeof value !== rules.type) {
            return res.status(400).json({
              error: `${field} must be ${rules.type}`
            });
          }
        }

        if (value && rules.minLength && value.length < rules.minLength) {
          return res.status(400).json({
            error: `${field} must be at least ${rules.minLength} characters`
          });
        }
      }

      next();
    } catch (error) {
      res.status(400).json({
        error: 'Invalid request'
      });
    }
  };
};

/**
 * User context middleware
 * Extracts user information from request
 */
export const extractUserContext = (req, res, next) => {
  req.user = {
    id: req.headers['x-user-id'] || 'anonymous',
    email: req.headers['x-user-email'] || 'unknown@example.com',
    organization: req.headers['x-organization'] || 'default',
    timestamp: new Date().toISOString()
  };

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
  });

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Prevent XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Remove server info
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred'
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * Generate API key
 */
export function generateAPIKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash API key for storage
 */
export function hashAPIKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API key against hash
 */
export function verifyAPIKey(key, hash) {
  return hashAPIKey(key) === hash;
}

export default {
  apiKeyAuth,
  jwtAuth,
  rateLimit,
  validateCORS,
  validateRequest,
  extractUserContext,
  requestLogger,
  securityHeaders,
  errorHandler,
  generateAPIKey,
  hashAPIKey,
  verifyAPIKey
};
