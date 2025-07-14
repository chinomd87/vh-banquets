const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { asyncHandler, validationHandler } = require('../middleware/errorMiddleware');
const { requireAdmin } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('admin', 'staff', 'client').optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  asyncHandler(async (req, res) => {
    const userResult = await query(`
      SELECT 
        id, email, first_name, last_name, role, is_active, 
        email_verified, last_login, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [req.user.id]);

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
          updatedAt: user.updated_at,
        }
      }
    });
  })
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
  validationHandler(userUpdateSchema.fork(['role', 'isActive'], (schema) => schema.forbidden())),
  asyncHandler(async (req, res) => {
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    // Map camelCase to snake_case for database fields
    const fieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
    };

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        const dbField = fieldMapping[key] || key;
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add updated_at timestamp
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add WHERE condition
    paramCount++;
    updateValues.push(req.user.id);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, is_active, updated_at
    `;

    const result = await query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    logger.info(`User profile updated: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          role: updatedUser.role,
          isActive: updatedUser.is_active,
          updatedAt: updatedUser.updated_at,
        }
      }
    });
  })
);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      isActive,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereConditions.push(`role = $${paramCount}`);
      queryParams.push(role);
    }

    if (isActive !== undefined) {
      paramCount++;
      whereConditions.push(`is_active = $${paramCount}`);
      queryParams.push(isActive === 'true');
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort parameters
    const validSortFields = ['first_name', 'last_name', 'email', 'role', 'created_at', 'last_login'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Main query
    const usersQuery = `
      SELECT 
        id, email, first_name, last_name, role, is_active, 
        email_verified, last_login, created_at
      FROM users
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM users
      ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      query(usersQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const users = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    }));

    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        }
      }
    });
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private/Admin
 */
router.get('/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const userResult = await query(`
      SELECT 
        id, email, first_name, last_name, role, is_active, 
        email_verified, last_login, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [userId]);

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
          updatedAt: user.updated_at,
        }
      }
    });
  })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Admin only)
 * @access  Private/Admin
 */
router.put('/:id',
  requireAdmin,
  validationHandler(userUpdateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const updates = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    // Map camelCase to snake_case for database fields
    const fieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      isActive: 'is_active',
    };

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        const dbField = fieldMapping[key] || key;
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add updated_at timestamp
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add WHERE condition
    paramCount++;
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, is_active, updated_at
    `;

    const result = await query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    logger.info(`User updated: ${updatedUser.email} by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          role: updatedUser.role,
          isActive: updatedUser.is_active,
          updatedAt: updatedUser.updated_at,
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check if user has any data that would prevent deletion
    const dataCheck = await query(`
      SELECT 
        (SELECT COUNT(*) FROM events WHERE user_id = $1) as event_count,
        (SELECT COUNT(*) FROM clients WHERE user_id = $1) as client_count,
        (SELECT COUNT(*) FROM staff WHERE user_id = $1) as staff_count
    `, [userId]);

    const counts = dataCheck.rows[0];
    const totalItems = parseInt(counts.event_count) + parseInt(counts.client_count) + parseInt(counts.staff_count);

    if (totalItems > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete user with associated data. User has ${counts.event_count} events, ${counts.client_count} clients, and ${counts.staff_count} staff members.`
      });
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const deletedUserEmail = result.rows[0].email;

    logger.info(`User deleted: ${deletedUserEmail} by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

/**
 * @route   GET /api/users/stats/overview
 * @desc    Get user statistics overview (Admin only)
 * @access  Private/Admin
 */
router.get('/stats/overview',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE role = 'staff') as staff_count,
        COUNT(*) FILTER (WHERE role = 'client') as client_count,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE last_login > CURRENT_TIMESTAMP - INTERVAL '30 days') as active_last_30_days
      FROM users
    `);

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: parseInt(stats.total_users),
          adminCount: parseInt(stats.admin_count),
          staffCount: parseInt(stats.staff_count),
          clientCount: parseInt(stats.client_count),
          activeUsers: parseInt(stats.active_users),
          activeLast30Days: parseInt(stats.active_last_30_days),
        }
      }
    });
  })
);

module.exports = router;
