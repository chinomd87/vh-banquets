const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vh-banquets.com', 'https://app.vh-banquets.com']
    : ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
}));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VH Banquets API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Mock authentication endpoints for testing
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: 'test-user-id',
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: 'user'
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 'test-user-id',
        email: req.body.email,
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token'
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@vhbanquets.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      }
    }
  });
});

// Mock CRUD endpoints for testing
const mockEndpoints = [
  'clients', 'events', 'staff', 'menu', 'payments', 
  'inventory', 'files', 'floorplans', 'contracts'
];

mockEndpoints.forEach(endpoint => {
  // GET list
  app.get(`/api/${endpoint}`, (req, res) => {
    res.json({
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
    });
  });

  // POST create
  app.post(`/api/${endpoint}`, (req, res) => {
    res.json({
      success: true,
      message: `${endpoint.slice(0, -1)} created successfully`,
      data: {
        id: `test-${endpoint}-id`,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  });

  // GET by ID
  app.get(`/api/${endpoint}/:id`, (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        name: `Test ${endpoint}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  });

  // PUT update
  app.put(`/api/${endpoint}/:id`, (req, res) => {
    res.json({
      success: true,
      message: `${endpoint.slice(0, -1)} updated successfully`,
      data: {
        id: req.params.id,
        ...req.body,
        updatedAt: new Date().toISOString()
      }
    });
  });

  // DELETE
  app.delete(`/api/${endpoint}/:id`, (req, res) => {
    res.json({
      success: true,
      message: `${endpoint.slice(0, -1)} deleted successfully`
    });
  });
});

// Additional endpoints for testing
app.get('/api/menu/categories/list', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'Appetizers', description: 'Starter courses' },
      { id: '2', name: 'Entrees', description: 'Main courses' },
      { id: '3', name: 'Desserts', description: 'Sweet treats' }
    ]
  });
});

app.get('/api/payments/stats/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 150000,
      pendingPayments: 5,
      completedPayments: 25,
      overduePayments: 2
    }
  });
});

app.get('/api/inventory/reports/low-stock', (req, res) => {
  res.json({
    success: true,
    data: {
      items: [],
      count: 0
    }
  });
});

app.get('/api/files/stats/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalFiles: 100,
      totalSize: 50000000,
      categories: {
        contracts: 25,
        photos: 45,
        documents: 30
      }
    }
  });
});

app.get('/api/contracts/stats/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalContracts: 50,
      signed: 35,
      pending: 10,
      draft: 5
    }
  });
});

// Users profile endpoint
app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'test-user-id',
      email: 'test@vhbanquets.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    }
  });
});

// Error handling for invalid UUIDs
app.get('/api/events/invalid-uuid', (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Invalid UUID format'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VH Banquets API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🧪 Mock API mode - all endpoints returning test data`);
});

module.exports = app;
