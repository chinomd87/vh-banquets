const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config();

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { authenticateToken } = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const clientRoutes = require('./routes/clients');
const staffRoutes = require('./routes/staff');
const menuRoutes = require('./routes/menu');
const paymentRoutes = require('./routes/payments');
const inventoryRoutes = require('./routes/inventory');
const fileRoutes = require('./routes/files');
const floorPlanRoutes = require('./routes/floorPlans');
const contractRoutes = require('./routes/contracts');

// Import services
const { connectDB } = require('./config/database');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://vhbanquets.com',
    'https://www.vhbanquets.com',
    'exp://localhost:19000', // Expo development
    'exp://192.168.1.100:19000', // Expo on LAN
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes without delay
  delayMs: 500, // add 500ms delay per request after delayAfter
});

app.use(limiter);
app.use(speedLimiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
} else {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/staff', authenticateToken, staffRoutes);
app.use('/api/menu', authenticateToken, menuRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/files', authenticateToken, fileRoutes);
app.use('/api/floor-plans', authenticateToken, floorPlanRoutes);
app.use('/api/contracts', authenticateToken, contractRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 VH Banquets API Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
