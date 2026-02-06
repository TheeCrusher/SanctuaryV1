// ============================================================
// Sanctuary API Server - Entry Point
// ============================================================
// This is the main file that starts the Express server.
// It sets up middleware (code that runs on every request),
// registers all API routes, and starts listening for requests.
//
// Run with: npm run dev (auto-restarts on changes)
// Or:       npm start  (production mode)
// ============================================================

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import pool from './config/db.js'
import authRoutes from './routes/auth.js'
import appointmentRoutes from './routes/appointments.js'
import churchRoutes from './routes/churches.js'
import conversationRoutes from './routes/conversations.js'
import userRoutes from './routes/users.js'
import quoteRoutes from './routes/quotes.js'
import noteRoutes from './routes/notes.js'
import favoriteRoutes from './routes/favorites.js'
import scriptureRoutes from './routes/scripture.js'

// Load environment variables from .env
dotenv.config()

// Create the Express app
const app = express()
const PORT = process.env.PORT || 3001

// ============================================================
// MIDDLEWARE
// ============================================================
// Middleware runs on EVERY request before your route handlers.
// Think of it like a security checkpoint at an airport.

// cors() - Allows the React frontend (port 5173) to make
//          requests to this backend (port 3001)
app.use(cors())

// express.json() - Parses JSON in request bodies so you can
//                  access it via req.body (e.g., login form data)
//                  Limit increased to 10mb for base64 photo uploads
app.use(express.json({ limit: '10mb' }))

// morgan('dev') - Logs every request to the console, like:
//                 "POST /api/auth/login 200 15ms"
//                 Super helpful for debugging!
app.use(morgan('dev'))

// ============================================================
// HEALTH CHECK ROUTE
// ============================================================
// A simple endpoint to verify the server is running.
// Also tests the database connection.

app.get('/api/health', async (req, res) => {
  try {
    // Try a simple database query to verify the connection
    const result = await pool.query('SELECT NOW() AS server_time')
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      serverTime: result.rows[0].server_time
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    })
  }
})

// ============================================================
// API ROUTES
// ============================================================
// Each route file handles a specific feature area.
// The first argument is the URL prefix for that group of routes.
// Example: authRoutes handles /api/auth/login and /api/auth/register

app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/churches', churchRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/users', userRoutes)
app.use('/api/quotes', quoteRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/scripture', scriptureRoutes)

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================
// This catches any errors that happen in route handlers.
// It must be defined AFTER all routes (Express uses order).

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack)
  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Something went wrong!'
  })
})

// ============================================================
// START THE SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🙏 Sanctuary API running on port ${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`)
})
