const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncWrapper, validateRequest } = require('../middleware/errorMiddleware');
const pool = require('../config/database');

const router = express.Router();

// Validation schemas
const createMenuItemSchema = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('category').trim().isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
  body('type').isIn(['appetizer', 'main_course', 'dessert', 'beverage', 'side']).withMessage('Invalid menu item type'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be positive number'),
  body('servingSize').optional().trim().isLength({ max: 50 }).withMessage('Serving size must be max 50 characters'),
  body('ingredients').optional().isArray().withMessage('Ingredients must be an array'),
  body('allergens').optional().isArray().withMessage('Allergens must be an array'),
  body('nutritionalInfo').optional().isObject().withMessage('Nutritional info must be an object'),
  body('isVegetarian').optional().isBoolean().withMessage('isVegetarian must be boolean'),
  body('isVegan').optional().isBoolean().withMessage('isVegan must be boolean'),
  body('isGlutenFree').optional().isBoolean().withMessage('isGlutenFree must be boolean'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
  body('minimumQuantity').optional().isInt({ min: 1 }).withMessage('Minimum quantity must be positive integer'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Preparation time must be non-negative integer')
];

const updateMenuItemSchema = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('category').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
  body('type').optional().isIn(['appetizer', 'main_course', 'dessert', 'beverage', 'side']).withMessage('Invalid menu item type'),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be positive number'),
  body('servingSize').optional().trim().isLength({ max: 50 }).withMessage('Serving size must be max 50 characters'),
  body('ingredients').optional().isArray().withMessage('Ingredients must be an array'),
  body('allergens').optional().isArray().withMessage('Allergens must be an array'),
  body('nutritionalInfo').optional().isObject().withMessage('Nutritional info must be an object'),
  body('isVegetarian').optional().isBoolean().withMessage('isVegetarian must be boolean'),
  body('isVegan').optional().isBoolean().withMessage('isVegan must be boolean'),
  body('isGlutenFree').optional().isBoolean().withMessage('isGlutenFree must be boolean'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
  body('minimumQuantity').optional().isInt({ min: 1 }).withMessage('Minimum quantity must be positive integer'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Preparation time must be non-negative integer')
];

const menuQuerySchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must be max 100 characters'),
  query('category').optional().trim().withMessage('Category filter invalid'),
  query('type').optional().isIn(['appetizer', 'main_course', 'dessert', 'beverage', 'side']).withMessage('Invalid type filter'),
  query('isVegetarian').optional().isBoolean().withMessage('isVegetarian must be boolean'),
  query('isVegan').optional().isBoolean().withMessage('isVegan must be boolean'),
  query('isGlutenFree').optional().isBoolean().withMessage('isGlutenFree must be boolean'),
  query('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive number'),
  query('sortBy').optional().isIn(['name', 'category', 'type', 'basePrice', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Get all menu items
router.get('/', authenticateToken, menuQuerySchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    type = '',
    isVegetarian,
    isVegan,
    isGlutenFree,
    isAvailable,
    minPrice,
    maxPrice,
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
      m.name ILIKE $${paramIndex} OR 
      m.description ILIKE $${paramIndex} OR 
      m.category ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (category) {
    whereConditions.push(`m.category ILIKE $${paramIndex}`);
    queryParams.push(`%${category}%`);
    paramIndex++;
  }

  if (type) {
    whereConditions.push(`m.type = $${paramIndex}`);
    queryParams.push(type);
    paramIndex++;
  }

  if (isVegetarian !== undefined) {
    whereConditions.push(`m.is_vegetarian = $${paramIndex}`);
    queryParams.push(isVegetarian);
    paramIndex++;
  }

  if (isVegan !== undefined) {
    whereConditions.push(`m.is_vegan = $${paramIndex}`);
    queryParams.push(isVegan);
    paramIndex++;
  }

  if (isGlutenFree !== undefined) {
    whereConditions.push(`m.is_gluten_free = $${paramIndex}`);
    queryParams.push(isGlutenFree);
    paramIndex++;
  }

  if (isAvailable !== undefined) {
    whereConditions.push(`m.is_available = $${paramIndex}`);
    queryParams.push(isAvailable);
    paramIndex++;
  }

  if (minPrice !== undefined) {
    whereConditions.push(`m.base_price >= $${paramIndex}`);
    queryParams.push(minPrice);
    paramIndex++;
  }

  if (maxPrice !== undefined) {
    whereConditions.push(`m.base_price <= $${paramIndex}`);
    queryParams.push(maxPrice);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM menu_items m 
    ${whereClause}
  `;
  
  const countResult = await pool.query(countQuery, queryParams);
  const totalItems = parseInt(countResult.rows[0].total);

  // Get menu items with pagination
  const menuQuery = `
    SELECT 
      m.id,
      m.name,
      m.description,
      m.category,
      m.type,
      m.base_price,
      m.serving_size,
      m.ingredients,
      m.allergens,
      m.nutritional_info,
      m.is_vegetarian,
      m.is_vegan,
      m.is_gluten_free,
      m.is_available,
      m.minimum_quantity,
      m.preparation_time,
      m.created_at,
      m.updated_at,
      COUNT(ems.event_id) as times_ordered
    FROM menu_items m
    LEFT JOIN event_menu_selections ems ON m.id = ems.menu_item_id
    ${whereClause}
    GROUP BY m.id
    ORDER BY m.${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(menuQuery, queryParams);

  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    data: {
      menuItems: result.rows,
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

// Get menu item by ID
router.get('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid menu item ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      m.id,
      m.name,
      m.description,
      m.category,
      m.type,
      m.base_price,
      m.serving_size,
      m.ingredients,
      m.allergens,
      m.nutritional_info,
      m.is_vegetarian,
      m.is_vegan,
      m.is_gluten_free,
      m.is_available,
      m.minimum_quantity,
      m.preparation_time,
      m.created_at,
      m.updated_at,
      COUNT(ems.event_id) as times_ordered,
      COALESCE(
        JSON_AGG(
          CASE WHEN e.id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'eventId', e.id,
              'eventTitle', e.title,
              'eventDate', e.event_date,
              'quantity', ems.quantity,
              'totalPrice', ems.total_price
            )
          END
        ) FILTER (WHERE e.id IS NOT NULL), 
        '[]'
      ) as recent_orders
    FROM menu_items m
    LEFT JOIN event_menu_selections ems ON m.id = ems.menu_item_id
    LEFT JOIN events e ON ems.event_id = e.id AND e.event_date >= CURRENT_DATE - INTERVAL '90 days'
    WHERE m.id = $1
    GROUP BY m.id
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Menu item not found'
    });
  }

  res.json({
    success: true,
    data: { menuItem: result.rows[0] }
  });
}));

// Create new menu item
router.post('/', authenticateToken, requireRole(['admin']), createMenuItemSchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    name,
    description,
    category,
    type,
    basePrice,
    servingSize,
    ingredients = [],
    allergens = [],
    nutritionalInfo = {},
    isVegetarian = false,
    isVegan = false,
    isGlutenFree = false,
    isAvailable = true,
    minimumQuantity = 1,
    preparationTime = 0
  } = req.body;

  // Check if menu item with same name already exists
  const existingItem = await pool.query('SELECT id FROM menu_items WHERE name = $1', [name]);
  if (existingItem.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'Menu item with this name already exists'
    });
  }

  const query = `
    INSERT INTO menu_items (
      name, description, category, type, base_price, serving_size,
      ingredients, allergens, nutritional_info, is_vegetarian, is_vegan,
      is_gluten_free, is_available, minimum_quantity, preparation_time
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, name, description, category, type, base_price, serving_size,
              ingredients, allergens, nutritional_info, is_vegetarian, is_vegan,
              is_gluten_free, is_available, minimum_quantity, preparation_time,
              created_at, updated_at
  `;

  const values = [
    name,
    description,
    category,
    type,
    basePrice,
    servingSize,
    JSON.stringify(ingredients),
    JSON.stringify(allergens),
    JSON.stringify(nutritionalInfo),
    isVegetarian,
    isVegan,
    isGlutenFree,
    isAvailable,
    minimumQuantity,
    preparationTime
  ];

  const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: 'Menu item created successfully',
    data: { menuItem: result.rows[0] }
  });
}));

// Update menu item
router.put('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid menu item ID'), updateMenuItemSchema, validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  // Check if menu item exists
  const existingItem = await pool.query('SELECT id FROM menu_items WHERE id = $1', [id]);
  if (existingItem.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Menu item not found'
    });
  }

  // Check if name is being changed and already exists
  if (req.body.name) {
    const nameCheck = await pool.query('SELECT id FROM menu_items WHERE name = $1 AND id != $2', [req.body.name, id]);
    if (nameCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Menu item with this name already exists'
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
    type: 'type',
    basePrice: 'base_price',
    servingSize: 'serving_size',
    ingredients: 'ingredients',
    allergens: 'allergens',
    nutritionalInfo: 'nutritional_info',
    isVegetarian: 'is_vegetarian',
    isVegan: 'is_vegan',
    isGlutenFree: 'is_gluten_free',
    isAvailable: 'is_available',
    minimumQuantity: 'minimum_quantity',
    preparationTime: 'preparation_time'
  };

  Object.keys(req.body).forEach(key => {
    if (allowedFields[key]) {
      updateFields.push(`${allowedFields[key]} = $${paramIndex}`);
      let value = req.body[key];
      
      // Stringify JSON fields
      if (key === 'ingredients' || key === 'allergens' || key === 'nutritionalInfo') {
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
    UPDATE menu_items 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, description, category, type, base_price, serving_size,
              ingredients, allergens, nutritional_info, is_vegetarian, is_vegan,
              is_gluten_free, is_available, minimum_quantity, preparation_time,
              created_at, updated_at
  `;

  const result = await pool.query(query, values);

  res.json({
    success: true,
    message: 'Menu item updated successfully',
    data: { menuItem: result.rows[0] }
  });
}));

// Delete menu item
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid menu item ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Check if menu item exists
  const existingItem = await pool.query('SELECT id FROM menu_items WHERE id = $1', [id]);
  if (existingItem.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Menu item not found'
    });
  }

  // Check if item has future event selections
  const futureSelections = await pool.query(`
    SELECT COUNT(*) as count 
    FROM event_menu_selections ems
    JOIN events e ON ems.event_id = e.id
    WHERE ems.menu_item_id = $1 AND e.event_date > CURRENT_DATE
  `, [id]);

  if (parseInt(futureSelections.rows[0].count) > 0) {
    return res.status(409).json({
      success: false,
      error: 'Cannot delete menu item with future event selections'
    });
  }

  await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Menu item deleted successfully'
  });
}));

// Get menu categories
router.get('/categories/list', authenticateToken, asyncWrapper(async (req, res) => {
  const query = `
    SELECT 
      category,
      COUNT(*) as item_count,
      AVG(base_price) as avg_price,
      MIN(base_price) as min_price,
      MAX(base_price) as max_price
    FROM menu_items 
    WHERE is_available = true
    GROUP BY category
    ORDER BY category
  `;

  const result = await pool.query(query);

  res.json({
    success: true,
    data: { categories: result.rows }
  });
}));

// Get popular menu items
router.get('/popular/list', authenticateToken, query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'), validateRequest, asyncWrapper(async (req, res) => {
  const { limit = 10 } = req.query;

  const query = `
    SELECT 
      m.id,
      m.name,
      m.category,
      m.type,
      m.base_price,
      COUNT(ems.event_id) as order_count,
      SUM(ems.quantity) as total_quantity_ordered,
      AVG(ems.total_price / ems.quantity) as avg_price_per_item
    FROM menu_items m
    JOIN event_menu_selections ems ON m.id = ems.menu_item_id
    JOIN events e ON ems.event_id = e.id
    WHERE e.event_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY m.id
    ORDER BY order_count DESC, total_quantity_ordered DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);

  res.json({
    success: true,
    data: { popularItems: result.rows }
  });
}));

module.exports = router;
