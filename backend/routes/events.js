const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { asyncHandler, validationHandler } = require('../middleware/errorMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const eventSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  eventDate: Joi.date().iso().required(),
  eventTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  guestCount: Joi.number().integer().min(0).default(0),
  estimatedCost: Joi.number().precision(2).min(0).default(0),
  eventType: Joi.string().max(100).optional(),
  venueLocation: Joi.string().max(500).optional(),
  specialRequests: Joi.string().max(1000).optional(),
  notes: Joi.string().max(1000).optional(),
  clientId: Joi.string().uuid().optional(),
  status: Joi.string().valid('planning', 'confirmed', 'in_progress', 'completed', 'cancelled').default('planning'),
});

const eventUpdateSchema = eventSchema.fork(['name', 'eventDate'], (schema) => schema.optional());

/**
 * @route   GET /api/events
 * @desc    Get all events for the authenticated user
 * @access  Private
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      eventType, 
      search,
      sortBy = 'event_date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['e.user_id = $1'];
    let queryParams = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`e.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (eventType) {
      paramCount++;
      whereConditions.push(`e.event_type = $${paramCount}`);
      queryParams.push(eventType);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(e.name ILIKE $${paramCount} OR e.venue_location ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Validate sort parameters
    const validSortFields = ['event_date', 'name', 'status', 'guest_count', 'estimated_cost', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'event_date';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Main query
    const eventsQuery = `
      SELECT 
        e.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        (SELECT COUNT(*) FROM event_staff_assignments esa WHERE esa.event_id = e.id) as staff_count,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.event_id = e.id AND p.payment_status = 'completed') as total_paid
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE ${whereClause}
      ORDER BY e.${sortField} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE ${whereClause}
    `;

    const [eventsResult, countResult] = await Promise.all([
      query(eventsQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const events = eventsResult.rows;
    const totalEvents = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalEvents / limit);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalEvents,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        }
      }
    });
  })
);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Private
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    const eventResult = await query(`
      SELECT 
        e.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        c.city as client_city,
        c.state as client_state,
        c.zip_code as client_zip_code,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.event_id = e.id AND p.payment_status = 'completed') as total_paid
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.id = $1 AND e.user_id = $2
    `, [eventId, req.user.id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Get menu selections
    const menuResult = await query(`
      SELECT 
        ems.*,
        mi.name as menu_item_name,
        mi.description as menu_item_description,
        mi.category as menu_item_category
      FROM event_menu_selections ems
      JOIN menu_items mi ON ems.menu_item_id = mi.id
      WHERE ems.event_id = $1
      ORDER BY mi.category, mi.name
    `, [eventId]);

    // Get staff assignments
    const staffResult = await query(`
      SELECT 
        esa.*,
        s.name as staff_name,
        s.role as staff_default_role,
        s.email as staff_email,
        s.phone as staff_phone
      FROM event_staff_assignments esa
      JOIN staff s ON esa.staff_id = s.id
      WHERE esa.event_id = $1
      ORDER BY s.name
    `, [eventId]);

    // Get payments
    const paymentsResult = await query(`
      SELECT * FROM payments
      WHERE event_id = $1
      ORDER BY payment_date DESC
    `, [eventId]);

    // Get timeline
    const timelineResult = await query(`
      SELECT * FROM event_timeline
      WHERE event_id = $1
      ORDER BY order_index ASC, scheduled_time ASC
    `, [eventId]);

    res.json({
      success: true,
      data: {
        event,
        menuSelections: menuResult.rows,
        staffAssignments: staffResult.rows,
        payments: paymentsResult.rows,
        timeline: timelineResult.rows,
      }
    });
  })
);

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private
 */
router.post('/',
  validationHandler(eventSchema),
  asyncHandler(async (req, res) => {
    const eventData = req.body;
    
    // Generate access code for client portal
    const accessCode = uuidv4().substr(0, 8).toUpperCase();

    const eventResult = await query(`
      INSERT INTO events (
        user_id, client_id, name, event_date, event_time, guest_count, 
        estimated_cost, event_type, venue_location, special_requests, 
        notes, status, access_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      req.user.id,
      eventData.clientId || null,
      eventData.name,
      eventData.eventDate,
      eventData.eventTime || null,
      eventData.guestCount || 0,
      eventData.estimatedCost || 0,
      eventData.eventType || null,
      eventData.venueLocation || null,
      eventData.specialRequests || null,
      eventData.notes || null,
      eventData.status || 'planning',
      accessCode
    ]);

    const event = eventResult.rows[0];

    logger.info(`New event created: ${event.name} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  })
);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event
 * @access  Private
 */
router.put('/:id',
  validationHandler(eventUpdateSchema),
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    const updates = req.body;

    // Check if event exists and belongs to user
    const existingEvent = await query(
      'SELECT id FROM events WHERE id = $1 AND user_id = $2',
      [eventId, req.user.id]
    );

    if (existingEvent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount}`);
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

    // Add WHERE conditions
    paramCount++;
    updateValues.push(eventId);
    paramCount++;
    updateValues.push(req.user.id);

    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedEvent = result.rows[0];

    logger.info(`Event updated: ${updatedEvent.name} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent }
    });
  })
);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private
 */
router.delete('/:id',
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    const result = await query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING name',
      [eventId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const deletedEventName = result.rows[0].name;

    logger.info(`Event deleted: ${deletedEventName} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  })
);

/**
 * @route   GET /api/events/:id/summary
 * @desc    Get event summary for reports
 * @access  Private
 */
router.get('/:id/summary',
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    // Get event with all related data
    const summaryResult = await query(`
      SELECT 
        e.*,
        c.name as client_name,
        c.email as client_email,
        (SELECT COUNT(*) FROM event_menu_selections ems WHERE ems.event_id = e.id) as menu_items_count,
        (SELECT COALESCE(SUM(ems.total_price), 0) FROM event_menu_selections ems WHERE ems.event_id = e.id) as menu_total,
        (SELECT COUNT(*) FROM event_staff_assignments esa WHERE esa.event_id = e.id) as staff_count,
        (SELECT COALESCE(SUM(esa.total_cost), 0) FROM event_staff_assignments esa WHERE esa.event_id = e.id) as staff_total,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.event_id = e.id AND p.payment_status = 'completed') as total_paid,
        (SELECT COUNT(*) FROM payments p WHERE p.event_id = e.id) as payment_count
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.id = $1 AND e.user_id = $2
    `, [eventId, req.user.id]);

    if (summaryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const summary = summaryResult.rows[0];
    const balanceDue = parseFloat(summary.estimated_cost || 0) - parseFloat(summary.total_paid || 0);

    res.json({
      success: true,
      data: {
        summary: {
          ...summary,
          balance_due: balanceDue,
          total_cost: parseFloat(summary.menu_total || 0) + parseFloat(summary.staff_total || 0),
        }
      }
    });
  })
);

module.exports = router;
