const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncWrapper, validateRequest } = require('../middleware/errorMiddleware');
const pool = require('../config/database');

const router = express.Router();

// Validation schemas
const createStaffSchema = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('position').trim().isLength({ min: 2, max: 100 }).withMessage('Position must be 2-100 characters'),
  body('department').optional().trim().isLength({ max: 100 }).withMessage('Department must be max 100 characters'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive number'),
  body('availability').optional().isObject().withMessage('Availability must be an object'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

const updateStaffSchema = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('position').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Position must be 2-100 characters'),
  body('department').optional().trim().isLength({ max: 100 }).withMessage('Department must be max 100 characters'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive number'),
  body('availability').optional().isObject().withMessage('Availability must be an object'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

const staffQuerySchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must be max 100 characters'),
  query('position').optional().trim().withMessage('Position filter invalid'),
  query('department').optional().trim().withMessage('Department filter invalid'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('sortBy').optional().isIn(['firstName', 'lastName', 'position', 'hourlyRate', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Get all staff members
router.get('/', authenticateToken, staffQuerySchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    position = '',
    department = '',
    isActive,
    sortBy = 'firstName',
    sortOrder = 'asc'
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Build WHERE clause
  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(
      s.first_name ILIKE $${paramIndex} OR 
      s.last_name ILIKE $${paramIndex} OR 
      s.email ILIKE $${paramIndex} OR 
      s.position ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (position) {
    whereConditions.push(`s.position ILIKE $${paramIndex}`);
    queryParams.push(`%${position}%`);
    paramIndex++;
  }

  if (department) {
    whereConditions.push(`s.department ILIKE $${paramIndex}`);
    queryParams.push(`%${department}%`);
    paramIndex++;
  }

  if (isActive !== undefined) {
    whereConditions.push(`s.is_active = $${paramIndex}`);
    queryParams.push(isActive);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM staff s 
    ${whereClause}
  `;
  
  const countResult = await pool.query(countQuery, queryParams);
  const totalStaff = parseInt(countResult.rows[0].total);

  // Get staff with pagination
  const staffQuery = `
    SELECT 
      s.id,
      s.first_name,
      s.last_name,
      s.email,
      s.phone,
      s.position,
      s.department,
      s.hourly_rate,
      s.availability,
      s.skills,
      s.notes,
      s.is_active,
      s.created_at,
      s.updated_at,
      COUNT(esa.event_id) as total_events_assigned
    FROM staff s
    LEFT JOIN event_staff_assignments esa ON s.id = esa.staff_id
    ${whereClause}
    GROUP BY s.id
    ORDER BY s.${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(staffQuery, queryParams);

  const totalPages = Math.ceil(totalStaff / limit);

  res.json({
    success: true,
    data: {
      staff: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStaff,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Get staff member by ID
router.get('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid staff ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      s.id,
      s.first_name,
      s.last_name,
      s.email,
      s.phone,
      s.position,
      s.department,
      s.hourly_rate,
      s.availability,
      s.skills,
      s.notes,
      s.is_active,
      s.created_at,
      s.updated_at,
      COUNT(esa.event_id) as total_events_assigned,
      COALESCE(
        JSON_AGG(
          CASE WHEN e.id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'id', e.id,
              'title', e.title,
              'event_date', e.event_date,
              'status', e.status,
              'role', esa.role,
              'hours_worked', esa.hours_worked
            )
          END
        ) FILTER (WHERE e.id IS NOT NULL), 
        '[]'
      ) as recent_events
    FROM staff s
    LEFT JOIN event_staff_assignments esa ON s.id = esa.staff_id
    LEFT JOIN events e ON esa.event_id = e.id AND e.event_date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE s.id = $1
    GROUP BY s.id
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Staff member not found'
    });
  }

  res.json({
    success: true,
    data: { staff: result.rows[0] }
  });
}));

// Create new staff member
router.post('/', authenticateToken, requireRole(['admin']), createStaffSchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    position,
    department,
    hourlyRate,
    availability = {},
    skills = [],
    notes,
    isActive = true
  } = req.body;

  // Check if email already exists
  const existingStaff = await pool.query('SELECT id FROM staff WHERE email = $1', [email]);
  if (existingStaff.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'Staff member with this email already exists'
    });
  }

  const query = `
    INSERT INTO staff (
      first_name, last_name, email, phone, position, department,
      hourly_rate, availability, skills, notes, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, first_name, last_name, email, phone, position, department,
              hourly_rate, availability, skills, notes, is_active, created_at, updated_at
  `;

  const values = [
    firstName,
    lastName,
    email,
    phone,
    position,
    department,
    hourlyRate,
    JSON.stringify(availability),
    JSON.stringify(skills),
    notes,
    isActive
  ];

  const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: 'Staff member created successfully',
    data: { staff: result.rows[0] }
  });
}));

// Update staff member
router.put('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid staff ID'), updateStaffSchema, validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  // Check if staff exists
  const existingStaff = await pool.query('SELECT id FROM staff WHERE id = $1', [id]);
  if (existingStaff.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Staff member not found'
    });
  }

  // Check if email is being changed and already exists
  if (req.body.email) {
    const emailCheck = await pool.query('SELECT id FROM staff WHERE email = $1 AND id != $2', [req.body.email, id]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Staff member with this email already exists'
      });
    }
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    position: 'position',
    department: 'department',
    hourlyRate: 'hourly_rate',
    availability: 'availability',
    skills: 'skills',
    notes: 'notes',
    isActive: 'is_active'
  };

  Object.keys(req.body).forEach(key => {
    if (allowedFields[key]) {
      updateFields.push(`${allowedFields[key]} = $${paramIndex}`);
      let value = req.body[key];
      
      // Stringify JSON fields
      if (key === 'availability' || key === 'skills') {
        value = JSON.stringify(value);
      }
      
      values.push(value);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid fields provided for update'
    });
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE staff 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, first_name, last_name, email, phone, position, department,
              hourly_rate, availability, skills, notes, is_active, created_at, updated_at
  `;

  const result = await pool.query(query, values);

  res.json({
    success: true,
    message: 'Staff member updated successfully',
    data: { staff: result.rows[0] }
  });
}));

// Delete staff member
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid staff ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Check if staff exists
  const existingStaff = await pool.query('SELECT id FROM staff WHERE id = $1', [id]);
  if (existingStaff.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Staff member not found'
    });
  }

  // Check if staff has future event assignments
  const futureAssignments = await pool.query(`
    SELECT COUNT(*) as count 
    FROM event_staff_assignments esa
    JOIN events e ON esa.event_id = e.id
    WHERE esa.staff_id = $1 AND e.event_date > CURRENT_DATE
  `, [id]);

  if (parseInt(futureAssignments.rows[0].count) > 0) {
    return res.status(409).json({
      success: false,
      error: 'Cannot delete staff member with future event assignments'
    });
  }

  await pool.query('DELETE FROM staff WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Staff member deleted successfully'
  });
}));

// Get staff availability
router.get('/:id/availability', authenticateToken, param('id').isUUID().withMessage('Invalid staff ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  const staff = await pool.query('SELECT id, first_name, last_name, availability FROM staff WHERE id = $1', [id]);
  if (staff.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Staff member not found'
    });
  }

  // Get assignments in date range if provided
  let assignments = [];
  if (startDate && endDate) {
    const assignmentQuery = `
      SELECT 
        e.id as event_id,
        e.title,
        e.event_date,
        e.start_time,
        e.end_time,
        esa.role,
        esa.hours_worked
      FROM event_staff_assignments esa
      JOIN events e ON esa.event_id = e.id
      WHERE esa.staff_id = $1 
        AND e.event_date >= $2 
        AND e.event_date <= $3
      ORDER BY e.event_date, e.start_time
    `;
    
    const assignmentResult = await pool.query(assignmentQuery, [id, startDate, endDate]);
    assignments = assignmentResult.rows;
  }

  res.json({
    success: true,
    data: {
      staff: {
        id: staff.rows[0].id,
        name: `${staff.rows[0].first_name} ${staff.rows[0].last_name}`,
        availability: staff.rows[0].availability
      },
      assignments
    }
  });
}));

// Update staff availability
router.put('/:id/availability', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid staff ID'), body('availability').isObject().withMessage('Availability must be an object'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { availability } = req.body;

  const result = await pool.query(`
    UPDATE staff 
    SET availability = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, first_name, last_name, availability
  `, [JSON.stringify(availability), id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Staff member not found'
    });
  }

  res.json({
    success: true,
    message: 'Staff availability updated successfully',
    data: { staff: result.rows[0] }
  });
}));

// Get staff performance stats
router.get('/:id/performance', authenticateToken, param('id').isUUID().withMessage('Invalid staff ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { year = new Date().getFullYear() } = req.query;

  const performanceQuery = `
    SELECT 
      COUNT(esa.event_id) as total_events,
      SUM(esa.hours_worked) as total_hours,
      AVG(esa.hours_worked) as avg_hours_per_event,
      COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_events,
      array_agg(DISTINCT esa.role) as roles_performed
    FROM event_staff_assignments esa
    JOIN events e ON esa.event_id = e.id
    WHERE esa.staff_id = $1 
      AND EXTRACT(year FROM e.event_date) = $2
  `;

  const monthlyQuery = `
    SELECT 
      EXTRACT(month FROM e.event_date) as month,
      COUNT(esa.event_id) as events,
      SUM(esa.hours_worked) as hours
    FROM event_staff_assignments esa
    JOIN events e ON esa.event_id = e.id
    WHERE esa.staff_id = $1 
      AND EXTRACT(year FROM e.event_date) = $2
    GROUP BY EXTRACT(month FROM e.event_date)
    ORDER BY month
  `;

  const [performanceResult, monthlyResult] = await Promise.all([
    pool.query(performanceQuery, [id, year]),
    pool.query(monthlyQuery, [id, year])
  ]);

  const performance = performanceResult.rows[0];
  const monthlyStats = monthlyResult.rows;

  res.json({
    success: true,
    data: {
      year: parseInt(year),
      summary: {
        totalEvents: parseInt(performance.total_events) || 0,
        totalHours: parseFloat(performance.total_hours) || 0,
        avgHoursPerEvent: parseFloat(performance.avg_hours_per_event) || 0,
        completedEvents: parseInt(performance.completed_events) || 0,
        rolesPerformed: performance.roles_performed || []
      },
      monthlyStats
    }
  });
}));

module.exports = router;
