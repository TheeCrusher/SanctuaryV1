// ============================================================
// Bible Routes (Highlights & Bookmarks)
// ============================================================
// GET    /api/bible/highlights       - List user's highlights
// POST   /api/bible/highlights       - Add a highlight
// PUT    /api/bible/highlights/:id   - Update highlight color
// DELETE /api/bible/highlights/:id   - Remove a highlight
//
// GET    /api/bible/bookmarks        - List user's bookmarks
// POST   /api/bible/bookmarks        - Add a bookmark
// DELETE /api/bible/bookmarks/:id    - Remove a bookmark
//
// All routes are protected (require JWT token).
// Maps to: AppContext.jsx → bibleHighlights & bibleBookmarks state
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All bible routes require authentication
router.use(authenticate)

// ---- Helper: convert snake_case row to camelCase ----
function formatHighlight(row) {
  return {
    id: row.id,
    userId: row.user_id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    color: row.color,
    createdAt: row.created_at
  }
}

function formatBookmark(row) {
  return {
    id: row.id,
    userId: row.user_id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    note: row.note,
    createdAt: row.created_at
  }
}

// ============================================================
// GET /api/bible/highlights
// ============================================================
// Returns all highlights for the logged-in user.

router.get('/highlights', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_bible_highlights WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ highlights: result.rows.map(formatHighlight) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/bible/highlights
// ============================================================
// Adds a highlight. If one already exists for that verse,
// updates the color instead (upsert pattern).

router.post('/highlights', async (req, res, next) => {
  try {
    const { book, chapter, verse, color } = req.body

    if (!book || !chapter || !verse) {
      return res.status(400).json({ error: 'book, chapter, and verse are required' })
    }

    const result = await pool.query(
      `INSERT INTO user_bible_highlights (user_id, book, chapter, verse, color)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, book, chapter, verse)
       DO UPDATE SET color = $5
       RETURNING *`,
      [req.user.id, book, chapter, verse, color || 'yellow']
    )

    res.status(201).json({ highlight: formatHighlight(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PUT /api/bible/highlights/:id
// ============================================================
// Updates the color of an existing highlight.

router.put('/highlights/:id', async (req, res, next) => {
  try {
    const { color } = req.body

    const result = await pool.query(
      `UPDATE user_bible_highlights SET color = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [color, req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Highlight not found' })
    }

    res.json({ highlight: formatHighlight(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/bible/highlights/:id
// ============================================================
// Removes a highlight (owner-only via WHERE user_id check).

router.delete('/highlights/:id', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM user_bible_highlights WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/bible/bookmarks
// ============================================================
// Returns all Bible bookmarks for the logged-in user.

router.get('/bookmarks', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_bible_bookmarks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ bookmarks: result.rows.map(formatBookmark) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/bible/bookmarks
// ============================================================
// Adds a Bible bookmark. Upserts if one already exists.

router.post('/bookmarks', async (req, res, next) => {
  try {
    const { book, chapter, verse, note } = req.body

    if (!book || !chapter) {
      return res.status(400).json({ error: 'book and chapter are required' })
    }

    const result = await pool.query(
      `INSERT INTO user_bible_bookmarks (user_id, book, chapter, verse, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, book, chapter, verse)
       DO UPDATE SET note = $5
       RETURNING *`,
      [req.user.id, book, chapter, verse || null, note || '']
    )

    res.status(201).json({ bookmark: formatBookmark(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/bible/bookmarks/:id
// ============================================================
// Removes a Bible bookmark (owner-only).

router.delete('/bookmarks/:id', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM user_bible_bookmarks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
