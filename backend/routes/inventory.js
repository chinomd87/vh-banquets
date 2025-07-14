const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncWrapper, validateRequest } = require('../middleware/errorMiddleware');
const pool = require('../config/database');

const router = express.Router();

// Validation schemas
const createInventoryItemSchema = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('category').trim().isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
  body('unit').trim().isLength({ min: 1, max: 20 }).withMessage('Unit must be 1-20 characters'),
  body('currentStock').isFloat({ min: 0 }).withMessage('Current stock must be non-negative number'),
  body('minimumStock').isFloat({ min: 0 }).withMessage('Minimum stock must be non-negative number'),
  body('unitCost').optional().isFloat({ min: 0 }).withMessage('Unit cost must be positive number'),
  body('supplier').optional().trim().isLength({ max: 100 }).withMessage('Supplier must be max 100 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

const updateInventoryItemSchema = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('category').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
  body('unit').optional().trim().isLength({ min: 1, max: 20 }).withMessage('Unit must be 1-20 characters'),
  body('currentStock').optional().isFloat({ min: 0 }).withMessage('Current stock must be non-negative number'),
  body('minimumStock').optional().isFloat({ min: 0 }).withMessage('Minimum stock must be non-negative number'),
  body('unitCost').optional().isFloat({ min: 0 }).withMessage('Unit cost must be positive number'),
  body('supplier').optional().trim().isLength({ max: 100 }).withMessage('Supplier must be max 100 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

const stockMovementSchema = [
  body('inventoryItemId').isUUID().withMessage('Valid inventory item ID is required'),
  body('movementType').isIn(['in', 'out', 'adjustment']).withMessage('Invalid movement type'),
  body('quantity').isFloat().withMessage('Quantity must be a number'),
  body('reason').trim().isLength({ min: 2, max: 200 }).withMessage('Reason must be 2-200 characters'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be max 500 characters'),
  body('unitCost').optional().isFloat({ min: 0 }).withMessage('Unit cost must be positive number')
];

const inventoryQuerySchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must be max 100 characters'),
  query('category').optional().trim().withMessage('Category filter invalid'),
  query('lowStock').optional().isBoolean().withMessage('lowStock must be boolean'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('sortBy').optional().isIn(['name', 'category', 'currentStock', 'minimumStock', 'unitCost', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Get all inventory items
router.get('/', authenticateToken, inventoryQuerySchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    lowStock,
    isActive,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Build WHERE clause
  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(
      i.name ILIKE $${paramIndex} OR 
      i.description ILIKE $${paramIndex} OR 
      i.category ILIKE $${paramIndex} OR
      i.supplier ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (category) {
    whereConditions.push(`i.category ILIKE $${paramIndex}`);
    queryParams.push(`%${category}%`);
    paramIndex++;
  }

  if (lowStock === 'true') {
    whereConditions.push(`i.current_stock <= i.minimum_stock`);
  }

  if (isActive !== undefined) {
    whereConditions.push(`i.is_active = $${paramIndex}`);
    queryParams.push(isActive);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM inventory_items i 
    ${whereClause}
  `;
  
  const countResult = await pool.query(countQuery, queryParams);
  const totalItems = parseInt(countResult.rows[0].total);

  // Get inventory items with pagination
  const inventoryQuery = `
    SELECT 
      i.id,
      i.name,
      i.description,
      i.category,
      i.unit,
      i.current_stock,
      i.minimum_stock,
      i.unit_cost,
      i.supplier,
      i.notes,
      i.is_active,
      i.created_at,
      i.updated_at,
      CASE WHEN i.current_stock <= i.minimum_stock THEN true ELSE false END as is_low_stock,
      COUNT(sm.id) as total_movements
    FROM inventory_items i
    LEFT JOIN stock_movements sm ON i.id = sm.inventory_item_id
    ${whereClause}
    GROUP BY i.id
    ORDER BY i.${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(inventoryQuery, queryParams);

  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    data: {
      inventory: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Get inventory item by ID
router.get('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid inventory item ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      i.id,
      i.name,
      i.description,
      i.category,
      i.unit,
      i.current_stock,
      i.minimum_stock,
      i.unit_cost,
      i.supplier,
      i.notes,
      i.is_active,
      i.created_at,
      i.updated_at,
      CASE WHEN i.current_stock <= i.minimum_stock THEN true ELSE false END as is_low_stock
    FROM inventory_items i
    WHERE i.id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Inventory item not found'
    });
  }

  res.json({
    success: true,
    data: { inventoryItem: result.rows[0] }
  });
}));

// Create new inventory item
router.post('/', authenticateToken, requireRole(['admin', 'staff']), createInventoryItemSchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    name,
    description,
    category,
    unit,
    currentStock,
    minimumStock,
    unitCost,
    supplier,
    notes,
    isActive = true
  } = req.body;

  // Check if item with same name already exists
  const existingItem = await pool.query('SELECT id FROM inventory_items WHERE name = $1', [name]);
  if (existingItem.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'Inventory item with this name already exists'
    });
  }

  const query = `
    INSERT INTO inventory_items (
      name, description, category, unit, current_stock, minimum_stock,
      unit_cost, supplier, notes, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, name, description, category, unit, current_stock, minimum_stock,
              unit_cost, supplier, notes, is_active, created_at, updated_at
  `;

  const values = [
    name,
    description,
    category,
    unit,
    currentStock,
    minimumStock,
    unitCost,
    supplier,
    notes,
    isActive
  ];

  const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: 'Inventory item created successfully',
    data: { inventoryItem: result.rows[0] }
  });
}));

// Update inventory item
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), param('id').isUUID().withMessage('Invalid inventory item ID'), updateInventoryItemSchema, validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  // Check if item exists
  const existingItem = await pool.query('SELECT id FROM inventory_items WHERE id = $1', [id]);
  if (existingItem.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Inventory item not found'
    });
  }

  // Check if name is being changed and already exists
  if (req.body.name) {
    const nameCheck = await pool.query('SELECT id FROM inventory_items WHERE name = $1 AND id != $2', [req.body.name, id]);
    if (nameCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Inventory item with this name already exists'
      });
    }
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = {
    name: 'name',
    description: 'description',
    category: 'category',
    unit: 'unit',
    currentStock: 'current_stock',
    minimumStock: 'minimum_stock',
    unitCost: 'unit_cost',
    supplier: 'supplier',
    notes: 'notes',
    isActive: 'is_active'
  };

  Object.keys(req.body).forEach(key => {
    if (allowedFields[key]) {
      updateFields.push(`${allowedFields[key]} = $${paramIndex}`);
      values.push(req.body[key]);
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
    UPDATE inventory_items 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, description, category, unit, current_stock, minimum_stock,
              unit_cost, supplier, notes, is_active, created_at, updated_at
  `;

  const result = await pool.query(query, values);

  res.json({
    success: true,
    message: 'Inventory item updated successfully',
    data: { inventoryItem: result.rows[0] }
  });
}));

// Delete inventory item
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid inventory item ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Check if item exists
  const existingItem = await pool.query('SELECT id FROM inventory_items WHERE id = $1', [id]);
  if (existingItem.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Inventory item not found'
    });
  }

  // Check if item has stock movements
  const movements = await pool.query('SELECT COUNT(*) as count FROM stock_movements WHERE inventory_item_id = $1', [id]);
  if (parseInt(movements.rows[0].count) > 0) {
    return res.status(409).json({
      success: false,
      error: 'Cannot delete inventory item with existing stock movements'
    });
  }

  await pool.query('DELETE FROM inventory_items WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Inventory item deleted successfully'
  });
}));

// Record stock movement
router.post('/movements', authenticateToken, requireRole(['admin', 'staff']), stockMovementSchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    inventoryItemId,
    movementType,
    quantity,
    reason,
    notes,
    unitCost
  } = req.body;

  // Verify inventory item exists
  const item = await pool.query('SELECT id, current_stock FROM inventory_items WHERE id = $1', [inventoryItemId]);
  if (item.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Inventory item not found'
    });
  }

  const currentStock = parseFloat(item.rows[0].current_stock);
  let newStock = currentStock;

  // Calculate new stock based on movement type
  switch (movementType) {
    case 'in':
      newStock = currentStock + Math.abs(quantity);
      break;
    case 'out':
      newStock = currentStock - Math.abs(quantity);
      break;
    case 'adjustment':
      newStock = currentStock + quantity; // quantity can be positive or negative
      break;
  }

  // Prevent negative stock
  if (newStock < 0) {
    return res.status(400).json({
      success: false,
      error: 'Stock movement would result in negative inventory'
    });
  }

  // Begin transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert stock movement
    const movementQuery = `
      INSERT INTO stock_movements (
        inventory_item_id, movement_type, quantity, reason, notes,
        unit_cost, performed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, inventory_item_id, movement_type, quantity, reason, notes,
                unit_cost, performed_by, created_at
    `;

    const movementValues = [
      inventoryItemId,
      movementType,
      quantity,
      reason,
      notes,
      unitCost,
      req.user.id
    ];

    const movementResult = await client.query(movementQuery, movementValues);

    // Update inventory item stock
    await client.query(
      'UPDATE inventory_items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, inventoryItemId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Stock movement recorded successfully',
      data: { 
        movement: movementResult.rows[0],
        newStock
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// Get stock movements for item
router.get('/:id/movements', authenticateToken, param('id').isUUID().withMessage('Invalid inventory item ID'), query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'), query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Verify inventory item exists
  const item = await pool.query('SELECT id, name FROM inventory_items WHERE id = $1', [id]);
  if (item.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Inventory item not found'
    });
  }

  const movementsQuery = `
    SELECT 
      sm.id,
      sm.movement_type,
      sm.quantity,
      sm.reason,
      sm.notes,
      sm.unit_cost,
      sm.created_at,
      u.first_name as performed_by_first_name,
      u.last_name as performed_by_last_name
    FROM stock_movements sm
    LEFT JOIN users u ON sm.performed_by = u.id
    WHERE sm.inventory_item_id = $1
    ORDER BY sm.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM stock_movements 
    WHERE inventory_item_id = $1
  `;

  const [movementsResult, countResult] = await Promise.all([
    pool.query(movementsQuery, [id, limit, offset]),
    pool.query(countQuery, [id])
  ]);

  const totalMovements = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalMovements / limit);

  res.json({
    success: true,
    data: {
      inventoryItem: {
        id: item.rows[0].id,
        name: item.rows[0].name
      },
      movements: movementsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalMovements,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Get low stock items
router.get('/reports/low-stock', authenticateToken, validateRequest, asyncWrapper(async (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      category,
      unit,
      current_stock,
      minimum_stock,
      supplier,
      (minimum_stock - current_stock) as stock_deficit
    FROM inventory_items
    WHERE current_stock <= minimum_stock AND is_active = true
    ORDER BY (minimum_stock - current_stock) DESC
  `;

  const result = await pool.query(query);

  res.json({
    success: true,
    data: { lowStockItems: result.rows }
  });
}));

// Get inventory statistics
router.get('/stats/overview', authenticateToken, validateRequest, asyncWrapper(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_items,
      COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_items,
      SUM(current_stock * unit_cost) as total_inventory_value,
      AVG(current_stock) as avg_stock_level
    FROM inventory_items
  `;

  const categoryQuery = `
    SELECT 
      category,
      COUNT(*) as item_count,
      SUM(current_stock * unit_cost) as category_value
    FROM inventory_items
    WHERE is_active = true
    GROUP BY category
    ORDER BY category_value DESC
  `;

  const [statsResult, categoryResult] = await Promise.all([
    pool.query(statsQuery),
    pool.query(categoryQuery)
  ]);

  const stats = statsResult.rows[0];
  const categories = categoryResult.rows;

  res.json({
    success: true,
    data: {
      overview: {
        totalItems: parseInt(stats.total_items),
        activeItems: parseInt(stats.active_items),
        lowStockItems: parseInt(stats.low_stock_items),
        totalInventoryValue: parseFloat(stats.total_inventory_value) || 0,
        avgStockLevel: parseFloat(stats.avg_stock_level) || 0
      },
      categories
    }
  });
}));

module.exports = router;
