// ============================================================
// Sanctuary API Server - Entry Point
// ============================================================
// This is the main file that starts the Express server.
// It sets up middleware, registers API routes, attaches
// Socket.io for real-time messaging, and starts listening.
//
// Run with: npm run dev (auto-restarts on changes)
// Or:       npm start  (production mode)
// ============================================================

import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import pool from './config/db.js'
import { setupSocket } from './socket.js'
import authRoutes from './routes/auth.js'
import appointmentRoutes from './routes/appointments.js'
import churchRoutes from './routes/churches.js'
import conversationRoutes from './routes/conversations.js'
import userRoutes from './routes/users.js'
import quoteRoutes from './routes/quotes.js'
import noteRoutes from './routes/notes.js'
import favoriteRoutes from './routes/favorites.js'
import scriptureRoutes from './routes/scripture.js'
import prayerRoutes from './routes/prayers.js'
import bibleRoutes from './routes/bible.js'
import communityRoutes from './routes/community.js'
import homeRoutes from './routes/home.js'
import eventRoutes from './routes/events.js'
import blockRoutes from './routes/blocks.js'
import notificationRoutes from './routes/notifications.js'
import churchAuthRoutes from './routes/church-auth.js'
import guidePostsRoutes from './routes/guide-posts.js'
import followsRoutes from './routes/follows.js'
import guideReviewsRoutes from './routes/guide-reviews.js'

// Load environment variables from .env
dotenv.config()

// Create the Express app and HTTP server
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// Attach Socket.io to the HTTP server
const io = setupSocket(server)

// Make io available to route handlers via req.app
app.set('io', io)

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

// ============================================================
// HEALTH CHECK ROUTE
// ============================================================

app.get('/api/health', async (req, res) => {
  try {
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

app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/churches', churchRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/users', userRoutes)
app.use('/api/quotes', quoteRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/scripture', scriptureRoutes)
app.use('/api/prayers', prayerRoutes)
app.use('/api/bible', bibleRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/blocks', blockRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/church-auth', churchAuthRoutes)
app.use('/api/guide-posts', guidePostsRoutes)
app.use('/api/follows', followsRoutes)
app.use('/api/guide-reviews', guideReviewsRoutes)

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================

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
// Using server.listen (HTTP server) instead of app.listen
// so Socket.io can share the same port.

server.listen(PORT, () => {
  console.log(`\n🙏 Sanctuary API running on port ${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
  console.log(`   WebSocket:    ws://localhost:${PORT}\n`)
})
