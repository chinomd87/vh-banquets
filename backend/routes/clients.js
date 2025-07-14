const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { asyncHandler, validationHandler } = require('../middleware/errorMiddleware');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const clientSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().max(50).optional().allow(''),
  address: Joi.string().max(500).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  state: Joi.string().max(50).optional().allow(''),
  zipCode: Joi.string().max(20).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow(''),
});

const clientUpdateSchema = clientSchema.fork(['name'], (schema) => schema.optional());

/**
 * @route   GET /api/clients
 * @desc    Get all clients for the authenticated user
 * @access  Private
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      search,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['c.user_id = $1'];
    let queryParams = [req.user.id];
    let paramCount = 1;

    if (search) {
      paramCount++;
      whereConditions.push(`(c.name ILIKE $${paramCount} OR c.email ILIKE $${paramCount} OR c.phone ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Validate sort parameters
    const validSortFields = ['name', 'email', 'city', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Main query with event counts
    const clientsQuery = `
      SELECT 
        c.*,
        COUNT(e.id) as event_count,
        COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_events,
        MAX(e.event_date) as last_event_date
      FROM clients c
      LEFT JOIN events e ON c.id = e.client_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.${sortField} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM clients c
      WHERE ${whereClause}
    `;

    const [clientsResult, countResult] = await Promise.all([
      query(clientsQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const clients = clientsResult.rows;
    const totalClients = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalClients / limit);

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalClients,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        }
      }
    });
  })
);

/**
 * @route   GET /api/clients/:id
 * @desc    Get single client by ID
 * @access  Private
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const clientId = req.params.id;

    const clientResult = await query(`
      SELECT 
        c.*,
        COUNT(e.id) as event_count,
        COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_events,
        COALESCE(SUM(e.estimated_cost), 0) as total_revenue
      FROM clients c
      LEFT JOIN events e ON c.id = e.client_id
      WHERE c.id = $1 AND c.user_id = $2
      GROUP BY c.id
    `, [clientId, req.user.id]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const client = clientResult.rows[0];

    // Get recent events for this client
    const eventsResult = await query(`
      SELECT id, name, event_date, status, guest_count, estimated_cost
      FROM events
      WHERE client_id = $1 AND user_id = $2
      ORDER BY event_date DESC
      LIMIT 10
    `, [clientId, req.user.id]);

    res.json({
      success: true,
      data: {
        client,
        recentEvents: eventsResult.rows,
      }
    });
  })
);

/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private
 */
router.post('/',
  validationHandler(clientSchema),
  asyncHandler(async (req, res) => {
    const clientData = req.body;

    const clientResult = await query(`
      INSERT INTO clients (
        user_id, name, email, phone, address, city, state, zip_code, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      req.user.id,
      clientData.name,
      clientData.email || null,
      clientData.phone || null,
      clientData.address || null,
      clientData.city || null,
      clientData.state || null,
      clientData.zipCode || null,
      clientData.notes || null,
    ]);

    const client = clientResult.rows[0];

    logger.info(`New client created: ${client.name} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: { client }
    });
  })
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private
 */
router.put('/:id',
  validationHandler(clientUpdateSchema),
  asyncHandler(async (req, res) => {
    const clientId = req.params.id;
    const updates = req.body;

    // Check if client exists and belongs to user
    const existingClient = await query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, req.user.id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    // Map camelCase to snake_case for database fields
    const fieldMapping = {
      zipCode: 'zip_code',
    };

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        const dbField = fieldMapping[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(updates[key] || null);
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

    // Add WHERE conditions
    paramCount++;
    updateValues.push(clientId);
    paramCount++;
    updateValues.push(req.user.id);

    const updateQuery = `
      UPDATE clients 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedClient = result.rows[0];

    logger.info(`Client updated: ${updatedClient.name} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: { client: updatedClient }
    });
  })
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client
 * @access  Private
 */
router.delete('/:id',
  asyncHandler(async (req, res) => {
    const clientId = req.params.id;

    // Check if client has any events
    const eventsCheck = await query(
      'SELECT COUNT(*) FROM events WHERE client_id = $1',
      [clientId]
    );

    const eventCount = parseInt(eventsCheck.rows[0].count);

    if (eventCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete client with ${eventCount} associated events. Please remove or reassign events first.`
      });
    }

    const result = await query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING name',
      [clientId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const deletedClientName = result.rows[0].name;

    logger.info(`Client deleted: ${deletedClientName} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  })
);

/**
 * @route   GET /api/clients/:id/events
 * @desc    Get all events for a specific client
 * @access  Private
 */
router.get('/:id/events',
  asyncHandler(async (req, res) => {
    const clientId = req.params.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Verify client belongs to user
    const clientCheck = await query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, req.user.id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const offset = (page - 1) * limit;
    
    let whereConditions = ['client_id = $1'];
    let queryParams = [clientId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const eventsQuery = `
      SELECT 
        id, name, event_date, status, guest_count, estimated_cost, venue_location,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE event_id = events.id AND payment_status = 'completed') as total_paid
      FROM events
      WHERE ${whereClause}
      ORDER BY event_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), offset);

    const events = await query(eventsQuery, queryParams);

    res.json({
      success: true,
      data: {
        events: events.rows
      }
    });
  })
);

module.exports = router;
