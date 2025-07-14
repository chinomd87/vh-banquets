#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const logger = require('../config/logger');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Run database migration
 */
async function migrate() {
  try {
    logger.info('🚀 Starting database migration...');

    // Check if database connection works
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connection successful');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    logger.info('📄 Schema file loaded');

    // Run migration
    await pool.query(schema);
    logger.info('✅ Database schema created successfully');

    // Check tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    logger.info(`📊 Created ${tables.length} tables:`, tables.join(', '));

    logger.info('🎉 Migration completed successfully!');

  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    if (error.detail) {
      logger.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Reset database (drop all tables)
 */
async function reset() {
  try {
    logger.info('⚠️  Resetting database (dropping all tables)...');

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const tables = tablesResult.rows.map(row => row.table_name);

    if (tables.length === 0) {
      logger.info('ℹ️  No tables found to drop');
      return;
    }

    // Drop all tables
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      logger.info(`🗑️  Dropped table: ${table}`);
    }

    // Drop extensions
    await pool.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
    
    logger.info('✅ Database reset completed');

  } catch (error) {
    logger.error('❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Check database status
 */
async function status() {
  try {
    logger.info('🔍 Checking database status...');

    // Check connection
    const timeResult = await pool.query('SELECT NOW()');
    logger.info(`⏰ Database time: ${timeResult.rows[0].now}`);

    // Check tables
    const tablesResult = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      logger.info('📊 No tables found - database needs migration');
    } else {
      logger.info(`📊 Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        logger.info(`  - ${row.table_name} (${row.column_count} columns)`);
      });
    }

    // Check for data
    const userCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);

    if (userCountResult.rows[0].count > 0) {
      const userDataResult = await pool.query('SELECT COUNT(*) as count FROM users');
      logger.info(`👥 Users in database: ${userDataResult.rows[0].count}`);
    }

    logger.info('✅ Status check completed');

  } catch (error) {
    logger.error('❌ Status check failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
  case 'up':
    migrate();
    break;
  case 'reset':
  case 'down':
    reset();
    break;
  case 'status':
    status();
    break;
  default:
    console.log(`
VH Banquets Database Migration Tool

Usage: node scripts/migrate.js <command>

Commands:
  migrate, up    - Run database migration (create tables)
  reset, down    - Reset database (drop all tables)
  status         - Check database status

Environment variables required:
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

Examples:
  npm run migrate
  node scripts/migrate.js migrate
  node scripts/migrate.js status
    `);
    process.exit(1);
}
