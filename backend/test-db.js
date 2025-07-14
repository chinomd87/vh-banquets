require('dotenv').config();
const { Pool } = require('pg');

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('📅 Database time:', result.rows[0].now);
    console.log('🐘 PostgreSQL version:', result.rows[0].version);
    
    // Test our tables
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:');
    tableResult.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    client.release();
    console.log('✅ Database test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
