const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncWrapper, validateRequest } = require('../middleware/errorMiddleware');
const pool = require('../config/database');

const router = express.Router();

// Validation schemas
const createContractSchema = [
  body('eventId').isUUID().withMessage('Valid event ID is required'),
  body('terms').trim().isLength({ min: 10, max: 5000 }).withMessage('Terms must be 10-5000 characters'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be positive number'),
  body('depositAmount').optional().isFloat({ min: 0 }).withMessage('Deposit amount must be positive number'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Invalid due date'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters')
];

const updateContractSchema = [
  body('terms').optional().trim().isLength({ min: 10, max: 5000 }).withMessage('Terms must be 10-5000 characters'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be positive number'),
  body('depositAmount').optional().isFloat({ min: 0 }).withMessage('Deposit amount must be positive number'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Invalid due date'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
  body('status').optional().isIn(['draft', 'sent', 'signed', 'cancelled']).withMessage('Invalid contract status'),
  body('signedDate').optional().isISO8601().toDate().withMessage('Invalid signed date')
];

// Get all contracts
router.get('/', authenticateToken, asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Build WHERE clause
  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (status) {
    whereConditions.push(`c.status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM contracts c 
    ${whereClause}
  `;
  
  const countResult = await pool.query(countQuery, queryParams);
  const totalContracts = parseInt(countResult.rows[0].total);

  // Get contracts with pagination
  const contractsQuery = `
    SELECT 
      c.id,
      c.event_id,
      c.terms,
      c.total_amount,
      c.deposit_amount,
      c.due_date,
      c.status,
      c.signed_date,
      c.notes,
      c.created_at,
      c.updated_at,
      e.title as event_title,
      e.event_date,
      cl.first_name as client_first_name,
      cl.last_name as client_last_name
    FROM contracts c
    JOIN events e ON c.event_id = e.id
    JOIN clients cl ON e.client_id = cl.id
    ${whereClause}
    ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(contractsQuery, queryParams);

  const totalPages = Math.ceil(totalContracts / limit);

  res.json({
    success: true,
    data: {
      contracts: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContracts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Get contract by ID
router.get('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid contract ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      c.id,
      c.event_id,
      c.terms,
      c.total_amount,
      c.deposit_amount,
      c.due_date,
      c.status,
      c.signed_date,
      c.notes,
      c.created_at,
      c.updated_at,
      e.title as event_title,
      e.event_date,
      e.start_time,
      e.end_time,
      e.guest_count,
      cl.first_name as client_first_name,
      cl.last_name as client_last_name,
      cl.email as client_email,
      cl.phone as client_phone
    FROM contracts c
    JOIN events e ON c.event_id = e.id
    JOIN clients cl ON e.client_id = cl.id
    WHERE c.id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Contract not found'
    });
  }

  res.json({
    success: true,
    data: { contract: result.rows[0] }
  });
}));

// Create new contract
router.post('/', authenticateToken, requireRole(['admin', 'staff']), createContractSchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    eventId,
    terms,
    totalAmount,
    depositAmount,
    dueDate,
    notes
  } = req.body;

  // Verify event exists
  const event = await pool.query('SELECT id FROM events WHERE id = $1', [eventId]);
  if (event.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  // Check if contract already exists for this event
  const existingContract = await pool.query('SELECT id FROM contracts WHERE event_id = $1', [eventId]);
  if (existingContract.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'Contract already exists for this event'
    });
  }

  const query = `
    INSERT INTO contracts (
      event_id, terms, total_amount, deposit_amount, due_date, notes, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'draft')
    RETURNING id, event_id, terms, total_amount, deposit_amount, due_date,
              status, notes, created_at, updated_at
  `;

  const values = [
    eventId,
    terms,
    totalAmount,
    depositAmount,
    dueDate,
    notes
  ];

  const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: 'Contract created successfully',
    data: { contract: result.rows[0] }
  });
}));

// Update contract
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), param('id').isUUID().withMessage('Invalid contract ID'), updateContractSchema, validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  // Check if contract exists
  const existingContract = await pool.query('SELECT id, status FROM contracts WHERE id = $1', [id]);
  if (existingContract.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Contract not found'
    });
  }

  // Prevent editing signed contracts (except for admin changing status)
  const currentStatus = existingContract.rows[0].status;
  if (currentStatus === 'signed' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Cannot modify signed contract'
    });
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = {
    terms: 'terms',
    totalAmount: 'total_amount',
    depositAmount: 'deposit_amount',
    dueDate: 'due_date',
    notes: 'notes',
    status: 'status',
    signedDate: 'signed_date'
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
    UPDATE contracts 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, event_id, terms, total_amount, deposit_amount, due_date,
              status, signed_date, notes, created_at, updated_at
  `;

  const result = await pool.query(query, values);

  res.json({
    success: true,
    message: 'Contract updated successfully',
    data: { contract: result.rows[0] }
  });
}));

// Delete contract
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid contract ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Check if contract exists
  const existingContract = await pool.query('SELECT id, status FROM contracts WHERE id = $1', [id]);
  if (existingContract.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Contract not found'
    });
  }

  // Prevent deleting signed contracts
  if (existingContract.rows[0].status === 'signed') {
    return res.status(409).json({
      success: false,
      error: 'Cannot delete signed contract'
    });
  }

  await pool.query('DELETE FROM contracts WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Contract deleted successfully'
  });
}));

// Sign contract
router.post('/:id/sign', authenticateToken, param('id').isUUID().withMessage('Invalid contract ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Check if contract exists and is in correct status
  const contract = await pool.query('SELECT id, status FROM contracts WHERE id = $1', [id]);
  if (contract.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Contract not found'
    });
  }

  if (contract.rows[0].status === 'signed') {
    return res.status(409).json({
      success: false,
      error: 'Contract is already signed'
    });
  }

  if (contract.rows[0].status !== 'sent') {
    return res.status(400).json({
      success: false,
      error: 'Contract must be sent before it can be signed'
    });
  }

  const query = `
    UPDATE contracts 
    SET status = 'signed', signed_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, event_id, status, signed_date, updated_at
  `;

  const result = await pool.query(query, [id]);

  res.json({
    success: true,
    message: 'Contract signed successfully',
    data: { contract: result.rows[0] }
  });
}));

// Get contract statistics
router.get('/stats/overview', authenticateToken, validateRequest, asyncWrapper(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const statsQuery = `
    SELECT 
      COUNT(*) as total_contracts,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_contracts,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_contracts,
      COUNT(CASE WHEN status = 'signed' THEN 1 END) as signed_contracts,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_contracts,
      SUM(total_amount) as total_contract_value,
      AVG(total_amount) as avg_contract_value
    FROM contracts c
    JOIN events e ON c.event_id = e.id
    WHERE EXTRACT(year FROM e.event_date) = $1
  `;

  const result = await pool.query(statsQuery, [year]);
  const stats = result.rows[0];

  res.json({
    success: true,
    data: {
      year: parseInt(year),
      overview: {
        totalContracts: parseInt(stats.total_contracts),
        draftContracts: parseInt(stats.draft_contracts),
        sentContracts: parseInt(stats.sent_contracts),
        signedContracts: parseInt(stats.signed_contracts),
        cancelledContracts: parseInt(stats.cancelled_contracts),
        totalContractValue: parseFloat(stats.total_contract_value) || 0,
        avgContractValue: parseFloat(stats.avg_contract_value) || 0
      }
    }
  });
}));

module.exports = router;
