// ============================================================
// Notes Routes
// ============================================================
// GET    /api/notes      - List all notes for the logged-in user
// POST   /api/notes      - Create a new note (optionally linked to an appointment)
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
    appointmentId: row.appointment_id || null,
    title: row.title,
    content: row.content,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Linked appointment details (from JOIN)
    appointmentDate: row.apt_date ? row.apt_date.toISOString().split('T')[0] : null,
    appointmentType: row.apt_type || null,
    otherPersonName: row.other_name || null,
    otherPersonRole: row.other_role || null
  }
}

// ============================================================
// GET /api/notes
// ============================================================
// Returns all notes for the logged-in user, newest first.
// JOINs with appointments and users to include linked session details.

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT n.*,
              a.date AS apt_date,
              a.type AS apt_type,
              CASE
                WHEN a.guide_id = $1 THEN COALESCE(us.name, a.seeker_name)
                ELSE COALESCE(ug.name, 'Unknown Guide')
              END AS other_name,
              CASE
                WHEN a.guide_id = $1 THEN COALESCE(us.role, 'Seeker')
                ELSE COALESCE(ug.role, 'Guide')
              END AS other_role
       FROM notes n
       LEFT JOIN appointments a ON n.appointment_id = a.id
       LEFT JOIN users ug ON a.guide_id = ug.id
       LEFT JOIN users us ON a.seeker_id = us.id
       WHERE n.user_id = $1
       ORDER BY n.updated_at DESC`,
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
// Creates a new note with title, content, optional tags, and optional appointment_id.

router.post('/', async (req, res, next) => {
  try {
    const { title, content, tags, appointmentId } = req.body

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' })
    }

    // Only allow known tag values
    const validTags = ['Prayer', 'Scripture', 'Reflection', 'Testimony', 'Question']
    const safeTags = (tags || []).filter(t => validTags.includes(t))

    const result = await pool.query(
      `INSERT INTO notes (user_id, appointment_id, title, content, tags)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, appointmentId || null, title.trim(), content.trim(), safeTags]
    )

    // If linked to an appointment, fetch the appointment details for the response
    const note = result.rows[0]
    if (note.appointment_id) {
      const aptResult = await pool.query(
        `SELECT a.date AS apt_date, a.type AS apt_type,
                CASE WHEN a.guide_id = $1 THEN COALESCE(us.name, a.seeker_name) ELSE COALESCE(ug.name, 'Unknown Guide') END AS other_name,
                CASE WHEN a.guide_id = $1 THEN COALESCE(us.role, 'Seeker') ELSE COALESCE(ug.role, 'Guide') END AS other_role
         FROM appointments a
         LEFT JOIN users ug ON a.guide_id = ug.id
         LEFT JOIN users us ON a.seeker_id = us.id
         WHERE a.id = $2`,
        [req.user.id, note.appointment_id]
      )
      if (aptResult.rows[0]) {
        Object.assign(note, aptResult.rows[0])
      }
    }

    res.status(201).json({ note: formatNote(note) })
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

    // Fetch linked appointment details if present
    const note = result.rows[0]
    if (note.appointment_id) {
      const aptResult = await pool.query(
        `SELECT a.date AS apt_date, a.type AS apt_type,
                CASE WHEN a.guide_id = $1 THEN COALESCE(us.name, a.seeker_name) ELSE COALESCE(ug.name, 'Unknown Guide') END AS other_name,
                CASE WHEN a.guide_id = $1 THEN COALESCE(us.role, 'Seeker') ELSE COALESCE(ug.role, 'Guide') END AS other_role
         FROM appointments a
         LEFT JOIN users ug ON a.guide_id = ug.id
         LEFT JOIN users us ON a.seeker_id = us.id
         WHERE a.id = $2`,
        [req.user.id, note.appointment_id]
      )
      if (aptResult.rows[0]) {
        Object.assign(note, aptResult.rows[0])
      }
    }

    res.json({ note: formatNote(note) })
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
