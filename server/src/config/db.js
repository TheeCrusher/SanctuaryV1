// ============================================================
// Database Connection Pool
// ============================================================
// This file creates a "pool" of PostgreSQL connections.
// Instead of opening a new connection for every request (slow),
// the pool keeps several connections ready and reuses them.
//
// Usage in route files:
//   import pool from '../config/db.js'
//   const result = await pool.query('SELECT * FROM users')
// ============================================================

import pg from 'pg'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Create the connection pool using the DATABASE_URL from .env
// SSL is required for cloud databases (Render) but not for local Docker
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Log when a connection is established (helpful for debugging)
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL')
})

// Handle unexpected errors (e.g., database goes down)
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err)
  process.exit(-1)
})

export default pool
