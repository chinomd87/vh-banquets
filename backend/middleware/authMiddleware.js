const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user info to request object
    req.user = {
      id: decoded.userId,
      email: userResult.rows[0].email,
      firstName: userResult.rows[0].first_name,
      lastName: userResult.rows[0].last_name,
      role: userResult.rows[0].role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if user is admin or staff
 */
const requireStaff = requireRole(['admin', 'staff']);

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = {
        id: decoded.userId,
        email: userResult.rows[0].email,
        firstName: userResult.rows[0].first_name,
        lastName: userResult.rows[0].last_name,
        role: userResult.rows[0].role,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    logger.warn('Optional auth failed:', error.message);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireStaff,
  optionalAuth,
};
