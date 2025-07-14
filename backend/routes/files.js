const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { body, query, param } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { asyncWrapper, validateRequest } = require('../middleware/errorMiddleware');
const pool = require('../config/database');
const crypto = require('crypto');
const path = require('path');

const router = express.Router();

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucket = process.env.AWS_S3_BUCKET;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Validation schemas
const uploadSchema = [
  body('entityType').isIn(['event', 'client', 'user', 'contract', 'floor_plan']).withMessage('Invalid entity type'),
  body('entityId').optional().isUUID().withMessage('Invalid entity ID'),
  body('category').optional().isIn(['document', 'image', 'contract', 'floor_plan', 'other']).withMessage('Invalid category'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters')
];

const fileQuerySchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('entityType').optional().isIn(['event', 'client', 'user', 'contract', 'floor_plan']).withMessage('Invalid entity type'),
  query('entityId').optional().isUUID().withMessage('Invalid entity ID'),
  query('category').optional().isIn(['document', 'image', 'contract', 'floor_plan', 'other']).withMessage('Invalid category'),
  query('fileType').optional().trim().withMessage('Invalid file type'),
  query('sortBy').optional().isIn(['fileName', 'fileSize', 'createdAt', 'category']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Helper function to generate unique filename
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}_${randomBytes}_${baseName}${extension}`;
};

// Helper function to upload file to S3
const uploadToS3 = async (file, fileName) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname
    }
  });

  await s3Client.send(command);
  return `https://${bucket}.s3.amazonaws.com/${fileName}`;
};

// Helper function to delete file from S3
const deleteFromS3 = async (fileName) => {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: fileName
  });

  await s3Client.send(command);
};

// Helper function to generate presigned URL
const generatePresignedUrl = async (fileName, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: fileName
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), uploadSchema, validateRequest, asyncWrapper(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided'
    });
  }

  if (!bucket) {
    return res.status(500).json({
      success: false,
      error: 'File storage not configured'
    });
  }

  const {
    entityType,
    entityId,
    category = 'other',
    description
  } = req.body;

  try {
    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);
    
    // Upload to S3
    const fileUrl = await uploadToS3(req.file, fileName);

    // Save file info to database
    const query = `
      INSERT INTO files (
        file_name, original_name, file_path, file_size, file_type,
        entity_type, entity_id, category, description, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, file_name, original_name, file_path, file_size, file_type,
                entity_type, entity_id, category, description, created_at
    `;

    const values = [
      fileName,
      req.file.originalname,
      fileUrl,
      req.file.size,
      req.file.mimetype,
      entityType,
      entityId || null,
      category,
      description,
      req.user.id
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file: result.rows[0] }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
}));

// Get all files
router.get('/', authenticateToken, fileQuerySchema, validateRequest, asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    entityType = '',
    entityId = '',
    category = '',
    fileType = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Build WHERE clause
  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (entityType) {
    whereConditions.push(`f.entity_type = $${paramIndex}`);
    queryParams.push(entityType);
    paramIndex++;
  }

  if (entityId) {
    whereConditions.push(`f.entity_id = $${paramIndex}`);
    queryParams.push(entityId);
    paramIndex++;
  }

  if (category) {
    whereConditions.push(`f.category = $${paramIndex}`);
    queryParams.push(category);
    paramIndex++;
  }

  if (fileType) {
    whereConditions.push(`f.file_type ILIKE $${paramIndex}`);
    queryParams.push(`%${fileType}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM files f 
    ${whereClause}
  `;
  
  const countResult = await pool.query(countQuery, queryParams);
  const totalFiles = parseInt(countResult.rows[0].total);

  // Get files with pagination
  const filesQuery = `
    SELECT 
      f.id,
      f.file_name,
      f.original_name,
      f.file_path,
      f.file_size,
      f.file_type,
      f.entity_type,
      f.entity_id,
      f.category,
      f.description,
      f.created_at,
      f.updated_at,
      u.first_name as uploaded_by_first_name,
      u.last_name as uploaded_by_last_name
    FROM files f
    LEFT JOIN users u ON f.uploaded_by = u.id
    ${whereClause}
    ORDER BY f.${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(filesQuery, queryParams);

  const totalPages = Math.ceil(totalFiles / limit);

  res.json({
    success: true,
    data: {
      files: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalFiles,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Get file by ID
router.get('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid file ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      f.id,
      f.file_name,
      f.original_name,
      f.file_path,
      f.file_size,
      f.file_type,
      f.entity_type,
      f.entity_id,
      f.category,
      f.description,
      f.created_at,
      f.updated_at,
      u.first_name as uploaded_by_first_name,
      u.last_name as uploaded_by_last_name
    FROM files f
    LEFT JOIN users u ON f.uploaded_by = u.id
    WHERE f.id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  res.json({
    success: true,
    data: { file: result.rows[0] }
  });
}));

// Get download URL for file
router.get('/:id/download', authenticateToken, param('id').isUUID().withMessage('Invalid file ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const fileResult = await pool.query('SELECT file_name, original_name FROM files WHERE id = $1', [id]);
  
  if (fileResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  const file = fileResult.rows[0];

  if (!bucket) {
    return res.status(500).json({
      success: false,
      error: 'File storage not configured'
    });
  }

  try {
    const downloadUrl = await generatePresignedUrl(file.file_name);

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: file.original_name,
        expiresIn: 3600 // 1 hour
      }
    });
  } catch (error) {
    console.error('Download URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download URL'
    });
  }
}));

// Update file metadata
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), param('id').isUUID().withMessage('Invalid file ID'), body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'), body('category').optional().isIn(['document', 'image', 'contract', 'floor_plan', 'other']).withMessage('Invalid category'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { description, category } = req.body;

  // Check if file exists
  const existingFile = await pool.query('SELECT id FROM files WHERE id = $1', [id]);
  if (existingFile.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex}`);
    values.push(description);
    paramIndex++;
  }

  if (category !== undefined) {
    updateFields.push(`category = $${paramIndex}`);
    values.push(category);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid fields provided for update'
    });
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE files 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, file_name, original_name, file_size, file_type,
              entity_type, entity_id, category, description, created_at, updated_at
  `;

  const result = await pool.query(query, values);

  res.json({
    success: true,
    message: 'File updated successfully',
    data: { file: result.rows[0] }
  });
}));

// Delete file
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isUUID().withMessage('Invalid file ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Get file info
  const fileResult = await pool.query('SELECT file_name FROM files WHERE id = $1', [id]);
  
  if (fileResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  const fileName = fileResult.rows[0].file_name;

  try {
    // Delete from S3 if configured
    if (bucket) {
      await deleteFromS3(fileName);
    }

    // Delete from database
    await pool.query('DELETE FROM files WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
}));

// Get files for specific entity
router.get('/entity/:entityType/:entityId', authenticateToken, param('entityType').isIn(['event', 'client', 'user', 'contract', 'floor_plan']).withMessage('Invalid entity type'), param('entityId').isUUID().withMessage('Invalid entity ID'), validateRequest, asyncWrapper(async (req, res) => {
  const { entityType, entityId } = req.params;

  const query = `
    SELECT 
      f.id,
      f.file_name,
      f.original_name,
      f.file_size,
      f.file_type,
      f.category,
      f.description,
      f.created_at,
      u.first_name as uploaded_by_first_name,
      u.last_name as uploaded_by_last_name
    FROM files f
    LEFT JOIN users u ON f.uploaded_by = u.id
    WHERE f.entity_type = $1 AND f.entity_id = $2
    ORDER BY f.created_at DESC
  `;

  const result = await pool.query(query, [entityType, entityId]);

  res.json({
    success: true,
    data: { files: result.rows }
  });
}));

// Get file storage statistics
router.get('/stats/overview', authenticateToken, validateRequest, asyncWrapper(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_files,
      SUM(file_size) as total_storage_bytes,
      AVG(file_size) as avg_file_size,
      COUNT(CASE WHEN category = 'image' THEN 1 END) as image_files,
      COUNT(CASE WHEN category = 'document' THEN 1 END) as document_files,
      COUNT(CASE WHEN category = 'contract' THEN 1 END) as contract_files,
      COUNT(CASE WHEN entity_type = 'event' THEN 1 END) as event_files,
      COUNT(CASE WHEN entity_type = 'client' THEN 1 END) as client_files
    FROM files
  `;

  const typeQuery = `
    SELECT 
      file_type,
      COUNT(*) as count,
      SUM(file_size) as total_size
    FROM files
    GROUP BY file_type
    ORDER BY count DESC
    LIMIT 10
  `;

  const [statsResult, typeResult] = await Promise.all([
    pool.query(statsQuery),
    pool.query(typeQuery)
  ]);

  const stats = statsResult.rows[0];
  const fileTypes = typeResult.rows;

  res.json({
    success: true,
    data: {
      overview: {
        totalFiles: parseInt(stats.total_files),
        totalStorageBytes: parseInt(stats.total_storage_bytes) || 0,
        totalStorageMB: Math.round((parseInt(stats.total_storage_bytes) || 0) / (1024 * 1024) * 100) / 100,
        avgFileSizeBytes: parseInt(stats.avg_file_size) || 0,
        imageFiles: parseInt(stats.image_files),
        documentFiles: parseInt(stats.document_files),
        contractFiles: parseInt(stats.contract_files),
        eventFiles: parseInt(stats.event_files),
        clientFiles: parseInt(stats.client_files)
      },
      fileTypes
    }
  });
}));

module.exports = router;
