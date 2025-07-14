const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncWrapper, validateRequest } = require('../middleware/errorMiddleware');
const pool = require('../config/database');

const router = express.Router();

// Validation schemas
const createFloorPlanSchema = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be positive integer'),
  body('layout').isObject().withMessage('Layout must be an object'),
  body('dimensions').optional().isObject().withMessage('Dimensions must be an object'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

const updateFloorPlanSchema = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be positive integer'),
  body('layout').optional().isObject().withMessage('Layout must be an object'),
  body('dimensions').optional().isObject().withMessage('Dimensions must be an object'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

// Get all floor plans
router.get('/', authenticateToken, asyncWrapper(async (req, res) => {
  const query = `
    SELECT 
      fp.id,
      fp.name,
      fp.description,
      fp.capacity,
      fp.layout,
      fp.dimensions,
      fp.is_active,
      fp.created_at,
      fp.updated_at,
      COUNT(e.id) as times_used
    FROM floor_plans fp
    LEFT JOIN events e ON fp.id = e.floor_plan_id
    GROUP BY fp.id
    ORDER BY fp.name
  `;

  const result = await pool.query(query);

  res.json({
    success: true,
    data: { floorPlans: result.rows }
  });
}));

// Get floor plan by ID
router.get('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid floor plan ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      fp.id,
      fp.name,
      fp.description,
      fp.capacity,
      fp.layout,
      fp.dimensions,
      fp.is_active,
      fp.created_at,
      fp.updated_at,
      COUNT(e.id) as times_used
    FROM floor_plans fp
    LEFT JOIN events e ON fp.id = e.floor_plan_id
    WHERE fp.id = $1
    GROUP BY fp.id
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Floor plan not found'
    });
  }

  res.json({
    success: true,
    data: { floorPlan: result.rows[0] }
  });
}));

// Create new floor plan
router.post('/', authenticateToken, requireRole(['admin']), createFloorPlanSchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    name,
    description,
    capacity,
    layout,
    dimensions = {},
    isActive = true
  } = req.body;

  const query = `
    INSERT INTO floor_plans (name, description, capacity, layout, dimensions, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, description, capacity, layout, dimensions, is_active, created_at, updated_at
  `;

  const values = [
    name,
    description,
    capacity,
    JSON.stringify(layout),
    JSON.stringify(dimensions),
    isActive
  ];

  const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: 'Floor plan created successfully',
    data: { floorPlan: result.rows[0] }
  });
}));

// Update floor plan
router.put('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid floor plan ID'), updateFloorPlanSchema, validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  // Check if floor plan exists
  const existingPlan = await pool.query('SELECT id FROM floor_plans WHERE id = $1', [id]);
  if (existingPlan.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Floor plan not found'
    });
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = {
    name: 'name',
    description: 'description',
    capacity: 'capacity',
    layout: 'layout',
    dimensions: 'dimensions',
    isActive: 'is_active'
  };

  Object.keys(req.body).forEach(key => {
    if (allowedFields[key]) {
      updateFields.push(`${allowedFields[key]} = $${paramIndex}`);
      let value = req.body[key];
      
      // Stringify JSON fields
      if (key === 'layout' || key === 'dimensions') {
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
    UPDATE floor_plans 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, description, capacity, layout, dimensions, is_active, created_at, updated_at
  `;

  const result = await pool.query(query, values);

  res.json({
    success: true,
    message: 'Floor plan updated successfully',
    data: { floorPlan: result.rows[0] }
  });
}));

// Delete floor plan
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid floor plan ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Check if floor plan exists
  const existingPlan = await pool.query('SELECT id FROM floor_plans WHERE id = $1', [id]);
  if (existingPlan.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Floor plan not found'
    });
  }

  // Check if floor plan is used in any events
  const usedInEvents = await pool.query('SELECT COUNT(*) as count FROM events WHERE floor_plan_id = $1', [id]);
  if (parseInt(usedInEvents.rows[0].count) > 0) {
    return res.status(409).json({
      success: false,
      error: 'Cannot delete floor plan that is used in events'
    });
  }

  await pool.query('DELETE FROM floor_plans WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Floor plan deleted successfully'
  });
}));

module.exports = router;
