// Load environment variables
require('dotenv').config();

console.log('Testing server startup...');

// Test environment variables
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_NAME:', process.env.DB_NAME);

// Test database connection
const { Pool } = require('pg');

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
};

console.log('Database config:', dbConfig);

const pool = new Pool(dbConfig);

pool.connect()
  .then((client) => {
    console.log('✅ Database connected successfully');
    client.release();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
