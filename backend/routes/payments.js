const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncWrapper, validateRequest } = require('../middleware/errorMiddleware');
const pool = require('../config/database');

const router = express.Router();

// Validation schemas
const createPaymentSchema = [
  body('eventId').isUUID().withMessage('Valid event ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive number'),
  body('paymentMethod').isIn(['cash', 'check', 'credit_card', 'bank_transfer', 'other']).withMessage('Invalid payment method'),
  body('paymentType').isIn(['deposit', 'partial', 'final', 'refund']).withMessage('Invalid payment type'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('transactionId').optional().trim().isLength({ max: 100 }).withMessage('Transaction ID must be max 100 characters'),
  body('paymentDate').optional().isISO8601().toDate().withMessage('Invalid payment date'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters')
];

const updatePaymentSchema = [
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive number'),
  body('paymentMethod').optional().isIn(['cash', 'check', 'credit_card', 'bank_transfer', 'other']).withMessage('Invalid payment method'),
  body('paymentType').optional().isIn(['deposit', 'partial', 'final', 'refund']).withMessage('Invalid payment type'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('transactionId').optional().trim().isLength({ max: 100 }).withMessage('Transaction ID must be max 100 characters'),
  body('paymentDate').optional().isISO8601().toDate().withMessage('Invalid payment date'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
  body('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status')
];

const paymentQuerySchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('eventId').optional().isUUID().withMessage('Invalid event ID'),
  query('paymentMethod').optional().isIn(['cash', 'check', 'credit_card', 'bank_transfer', 'other']).withMessage('Invalid payment method'),
  query('paymentType').optional().isIn(['deposit', 'partial', 'final', 'refund']).withMessage('Invalid payment type'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status'),
  query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be positive number'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be positive number'),
  query('sortBy').optional().isIn(['amount', 'paymentDate', 'paymentMethod', 'status', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Get all payments
router.get('/', authenticateToken, paymentQuerySchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    eventId = '',
    paymentMethod = '',
    paymentType = '',
    status = '',
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy = 'paymentDate',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Build WHERE clause
  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (eventId) {
    whereConditions.push(`p.event_id = $${paramIndex}`);
    queryParams.push(eventId);
    paramIndex++;
  }

  if (paymentMethod) {
    whereConditions.push(`p.payment_method = $${paramIndex}`);
    queryParams.push(paymentMethod);
    paramIndex++;
  }

  if (paymentType) {
    whereConditions.push(`p.payment_type = $${paramIndex}`);
    queryParams.push(paymentType);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`p.status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  if (startDate) {
    whereConditions.push(`p.payment_date >= $${paramIndex}`);
    queryParams.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    whereConditions.push(`p.payment_date <= $${paramIndex}`);
    queryParams.push(endDate);
    paramIndex++;
  }

  if (minAmount !== undefined) {
    whereConditions.push(`p.amount >= $${paramIndex}`);
    queryParams.push(minAmount);
    paramIndex++;
  }

  if (maxAmount !== undefined) {
    whereConditions.push(`p.amount <= $${paramIndex}`);
    queryParams.push(maxAmount);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM payments p 
    ${whereClause}
  `;
  
  const countResult = await pool.query(countQuery, queryParams);
  const totalPayments = parseInt(countResult.rows[0].total);

  // Get payments with pagination
  const paymentsQuery = `
    SELECT 
      p.id,
      p.event_id,
      p.amount,
      p.payment_method,
      p.payment_type,
      p.description,
      p.transaction_id,
      p.payment_date,
      p.status,
      p.notes,
      p.created_at,
      p.updated_at,
      e.title as event_title,
      e.event_date,
      c.first_name as client_first_name,
      c.last_name as client_last_name
    FROM payments p
    JOIN events e ON p.event_id = e.id
    JOIN clients c ON e.client_id = c.id
    ${whereClause}
    ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(paymentsQuery, queryParams);

  const totalPages = Math.ceil(totalPayments / limit);

  res.json({
    success: true,
    data: {
      payments: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPayments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Get payment by ID
router.get('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid payment ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      p.id,
      p.event_id,
      p.amount,
      p.payment_method,
      p.payment_type,
      p.description,
      p.transaction_id,
      p.payment_date,
      p.status,
      p.notes,
      p.created_at,
      p.updated_at,
      e.title as event_title,
      e.event_date,
      e.total_cost as event_total_cost,
      c.first_name as client_first_name,
      c.last_name as client_last_name,
      c.email as client_email,
      c.phone as client_phone
    FROM payments p
    JOIN events e ON p.event_id = e.id
    JOIN clients c ON e.client_id = c.id
    WHERE p.id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  res.json({
    success: true,
    data: { payment: result.rows[0] }
  });
}));

// Create new payment
router.post('/', authenticateToken, requireRole(['admin', 'staff']), createPaymentSchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    eventId,
    amount,
    paymentMethod,
    paymentType,
    description,
    transactionId,
    paymentDate = new Date(),
    notes
  } = req.body;

  // Verify event exists
  const event = await pool.query('SELECT id, total_cost FROM events WHERE id = $1', [eventId]);
  if (event.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  const query = `
    INSERT INTO payments (
      event_id, amount, payment_method, payment_type, description,
      transaction_id, payment_date, notes, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
    RETURNING id, event_id, amount, payment_method, payment_type, description,
              transaction_id, payment_date, status, notes, created_at, updated_at
  `;

  const values = [
    eventId,
    amount,
    paymentMethod,
    paymentType,
    description,
    transactionId,
    paymentDate,
    notes
  ];

  const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    data: { payment: result.rows[0] }
  });
}));

// Update payment
router.put('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid payment ID'), updatePaymentSchema, validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  // Check if payment exists
  const existingPayment = await pool.query('SELECT id FROM payments WHERE id = $1', [id]);
  if (existingPayment.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = {
    amount: 'amount',
    paymentMethod: 'payment_method',
    paymentType: 'payment_type',
    description: 'description',
    transactionId: 'transaction_id',
    paymentDate: 'payment_date',
    notes: 'notes',
    status: 'status'
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
    UPDATE payments 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, event_id, amount, payment_method, payment_type, description,
              transaction_id, payment_date, status, notes, created_at, updated_at
  `;

  const result = await pool.query(query, values);

  res.json({
    success: true,
    message: 'Payment updated successfully',
    data: { payment: result.rows[0] }
  });
}));

// Delete payment
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid payment ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Check if payment exists
  const existingPayment = await pool.query('SELECT id FROM payments WHERE id = $1', [id]);
  if (existingPayment.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  await pool.query('DELETE FROM payments WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Payment deleted successfully'
  });
}));

// Get payments for specific event
router.get('/event/:eventId', authenticateToken, param('eventId').isUUID().withMessage('Invalid event ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { eventId } = req.params;

  // Verify event exists
  const event = await pool.query('SELECT id, title, total_cost FROM events WHERE id = $1', [eventId]);
  if (event.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  const paymentsQuery = `
    SELECT 
      p.id,
      p.amount,
      p.payment_method,
      p.payment_type,
      p.description,
      p.transaction_id,
      p.payment_date,
      p.status,
      p.notes,
      p.created_at
    FROM payments p
    WHERE p.event_id = $1
    ORDER BY p.payment_date DESC, p.created_at DESC
  `;

  const summaryQuery = `
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_paid,
      SUM(CASE WHEN payment_type = 'deposit' THEN amount ELSE 0 END) as deposits,
      SUM(CASE WHEN payment_type = 'partial' THEN amount ELSE 0 END) as partial_payments,
      SUM(CASE WHEN payment_type = 'final' THEN amount ELSE 0 END) as final_payments,
      SUM(CASE WHEN payment_type = 'refund' THEN amount ELSE 0 END) as refunds
    FROM payments
    WHERE event_id = $1 AND status = 'completed'
  `;

  const [paymentsResult, summaryResult] = await Promise.all([
    pool.query(paymentsQuery, [eventId]),
    pool.query(summaryQuery, [eventId])
  ]);

  const eventInfo = event.rows[0];
  const payments = paymentsResult.rows;
  const summary = summaryResult.rows[0];

  const totalPaid = parseFloat(summary.total_paid) || 0;
  const remainingBalance = parseFloat(eventInfo.total_cost) - totalPaid;

  res.json({
    success: true,
    data: {
      event: {
        id: eventInfo.id,
        title: eventInfo.title,
        totalCost: parseFloat(eventInfo.total_cost),
        totalPaid,
        remainingBalance
      },
      payments,
      summary: {
        totalPayments: parseInt(summary.total_payments),
        totalPaid,
        deposits: parseFloat(summary.deposits) || 0,
        partialPayments: parseFloat(summary.partial_payments) || 0,
        finalPayments: parseFloat(summary.final_payments) || 0,
        refunds: parseFloat(summary.refunds) || 0
      }
    }
  });
}));

// Get payment statistics
router.get('/stats/overview', authenticateToken, query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Invalid year'), validateRequest, asyncWrapper(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const statsQuery = `
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_revenue,
      AVG(amount) as avg_payment_amount,
      COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
      COUNT(CASE WHEN payment_method = 'credit_card' THEN 1 END) as card_payments,
      COUNT(CASE WHEN payment_method = 'check' THEN 1 END) as check_payments,
      COUNT(CASE WHEN payment_method = 'bank_transfer' THEN 1 END) as transfer_payments,
      SUM(CASE WHEN payment_type = 'deposit' THEN amount ELSE 0 END) as deposits_total,
      SUM(CASE WHEN payment_type = 'final' THEN amount ELSE 0 END) as final_payments_total,
      SUM(CASE WHEN payment_type = 'refund' THEN amount ELSE 0 END) as refunds_total
    FROM payments
    WHERE EXTRACT(year FROM payment_date) = $1 
      AND status = 'completed'
  `;

  const monthlyQuery = `
    SELECT 
      EXTRACT(month FROM payment_date) as month,
      COUNT(*) as payment_count,
      SUM(amount) as revenue
    FROM payments
    WHERE EXTRACT(year FROM payment_date) = $1 
      AND status = 'completed'
    GROUP BY EXTRACT(month FROM payment_date)
    ORDER BY month
  `;

  const [statsResult, monthlyResult] = await Promise.all([
    pool.query(statsQuery, [year]),
    pool.query(monthlyQuery, [year])
  ]);

  const stats = statsResult.rows[0];
  const monthlyStats = monthlyResult.rows;

  res.json({
    success: true,
    data: {
      year: parseInt(year),
      overview: {
        totalPayments: parseInt(stats.total_payments),
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        avgPaymentAmount: parseFloat(stats.avg_payment_amount) || 0,
        depositsTotal: parseFloat(stats.deposits_total) || 0,
        finalPaymentsTotal: parseFloat(stats.final_payments_total) || 0,
        refundsTotal: parseFloat(stats.refunds_total) || 0
      },
      paymentMethods: {
        cash: parseInt(stats.cash_payments),
        creditCard: parseInt(stats.card_payments),
        check: parseInt(stats.check_payments),
        bankTransfer: parseInt(stats.transfer_payments)
      },
      monthlyStats
    }
  });
}));

module.exports = router;
