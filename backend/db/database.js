/**
 * Tenant PGMS - Unified Database Configuration
 * Supports both Local SQLite and Supabase PostgreSQL.
 */

const Database = require('better-sqlite3');
const knex = require('knex');
const path = require('path');
require('dotenv').config();

// Configuration Settings
const dbType = process.env.DB_TYPE || 'supabase'; // Default to supabase for the migration
const DATABASE_URL = process.env.DATABASE_URL;

let db;

if (dbType === 'supabase') {
  console.log('☁️  Initializing Supabase Cloud Connection...');
  if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is missing in .env');
    process.exit(1);
  }

  db = knex({
    client: 'pg',
    connection: {
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    pool: { min: 2, max: 20 }
  });
} else {
  console.log('📁 Initializing Local SQLite Connection...');
  const dbPath = DATABASE_URL || path.join(__dirname, '../../PGMS/backend/dev.sqlite3');
  db = new Database(dbPath, { verbose: console.log });
}

// Export both the connection and the type for route handling
module.exports = { db, dbType };
