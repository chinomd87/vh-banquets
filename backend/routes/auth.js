const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { asyncHandler, validationHandler } = require('../middleware/errorMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('admin', 'staff', 'client').default('admin'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (for now - should be admin only in production)
 */
router.post('/register', 
  validationHandler(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role = 'admin' } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, role, true]
    );

    const user = userResult.rows[0];

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token (hashed)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      }
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validationHandler(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const userResult = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token (hashed)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      }
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  validationHandler(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token type'
        });
      }

      // Check if refresh token exists and is not expired
      const tokenResult = await query(
        `SELECT rt.id, rt.token_hash, u.id as user_id, u.email, u.first_name, u.last_name, u.role, u.is_active
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         WHERE rt.user_id = $1 AND rt.expires_at > CURRENT_TIMESTAMP AND rt.is_revoked = false`,
        [decoded.userId]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token'
        });
      }

      const tokenData = tokenResult.rows[0];

      // Verify the token hash
      const isTokenValid = await bcrypt.compare(refreshToken, tokenData.token_hash);

      if (!isTokenValid || !tokenData.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const tokens = generateTokens(tokenData.user_id);

      // Store new refresh token
      const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [tokenData.user_id, newRefreshTokenHash, expiresAt]
      );

      // Revoke old refresh token
      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE id = $1',
        [tokenData.id]
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: {
            id: tokenData.user_id,
            email: tokenData.email,
            firstName: tokenData.first_name,
            lastName: tokenData.last_name,
            role: tokenData.role,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the specific refresh token
      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND token_hash = $2',
        [req.user.id, await bcrypt.hash(refreshToken, 10)]
      );
    } else {
      // Revoke all refresh tokens for the user
      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
        [req.user.id]
      );
    }

    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, is_active, email_verified, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at,
        }
      }
    });
  })
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticateToken,
  validationHandler(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    // Revoke all refresh tokens to force re-login
    await query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
      [req.user.id]
    );

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

module.exports = router;
