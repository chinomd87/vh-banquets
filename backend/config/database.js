const { Pool } = require('pg');
const logger = require('./logger');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait when connecting a client
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    logger.info('✅ PostgreSQL connected successfully');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    logger.info(`📅 Database time: ${result.rows[0].now}`);
    
    client.release();
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
};

// Handle pool errors
pool.on('error', (err) => {
  logger.error('🚨 Unexpected error on idle client:', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🔌 Closing PostgreSQL connection pool...');
  pool.end(() => {
    logger.info('✅ PostgreSQL pool has ended');
    process.exit(0);
  });
});

module.exports = {
  pool,
  connectDB,
  query: (text, params) => pool.query(text, params),
};
