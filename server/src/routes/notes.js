// ============================================================
// Notes Routes
// ============================================================
// GET    /api/notes      - List all notes for the logged-in user
// POST   /api/notes      - Create a new note
// PUT    /api/notes/:id  - Update a note
// DELETE /api/notes/:id  - Delete a note
//
// All routes are protected (require JWT token).
// Maps to: AppContext.jsx → notes state + functions
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All note routes require authentication
router.use(authenticate)

// Helper: convert a DB row to camelCase for the frontend
function formatNote(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// ============================================================
// GET /api/notes
// ============================================================
// Returns all notes for the logged-in user, newest first.

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    )
    res.json({ notes: result.rows.map(formatNote) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/notes
// ============================================================
// Creates a new note with title, content, and optional tags.

router.post('/', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' })
    }

    // Only allow known tag values
    const validTags = ['Prayer', 'Scripture', 'Reflection', 'Testimony', 'Question']
    const safeTags = (tags || []).filter(t => validTags.includes(t))

    const result = await pool.query(
      `INSERT INTO notes (user_id, title, content, tags)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title.trim(), content.trim(), safeTags]
    )

    res.status(201).json({ note: formatNote(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PUT /api/notes/:id
// ============================================================
// Updates an existing note. Only the note's owner can edit it.

router.put('/:id', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' })
    }

    const validTags = ['Prayer', 'Scripture', 'Reflection', 'Testimony', 'Question']
    const safeTags = (tags || []).filter(t => validTags.includes(t))

    const result = await pool.query(
      `UPDATE notes SET title = $1, content = $2, tags = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [title.trim(), content.trim(), safeTags, req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' })
    }

    res.json({ note: formatNote(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/notes/:id
// ============================================================
// Deletes a note. Only the note's owner can delete it.

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
