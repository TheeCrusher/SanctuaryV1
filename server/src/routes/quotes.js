// ============================================================
// Quote Routes
// ============================================================
// GET /api/quotes/daily - Get today's Bible quote
//
// This route is protected (requires JWT token).
// Replaces: getDailyQuote() function in AppContext.jsx
//
// The quote selection uses the same date-based algorithm
// as the frontend: pick a quote based on today's date so
// every user sees the same quote on the same day.
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// ============================================================
// GET /api/quotes/daily
// ============================================================
// Returns today's Bible quote.
//
// Algorithm (same as frontend):
//   seed = year * 10000 + month * 100 + day
//   index = seed % totalQuotes

router.get('/daily', async (req, res, next) => {
  try {
    // Get total number of quotes
    const countResult = await pool.query('SELECT COUNT(*) FROM bible_quotes')
    const totalQuotes = parseInt(countResult.rows[0].count)

    if (totalQuotes === 0) {
      return res.status(404).json({ error: 'No quotes found in database.' })
    }

    // Calculate today's quote index (same logic as getDailyQuote in AppContext)
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const quoteIndex = seed % totalQuotes

    // Get the quote at that index
    // OFFSET skips rows, LIMIT 1 gets exactly one
    const result = await pool.query(
      'SELECT text, ref FROM bible_quotes ORDER BY id ASC LIMIT 1 OFFSET $1',
      [quoteIndex]
    )

    res.json({ quote: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

export default router
