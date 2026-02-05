// ============================================================
// Appointment Routes
// ============================================================
// GET    /api/appointments          - List all appointments for the logged-in guide
// POST   /api/appointments          - Create a new appointment
// PATCH  /api/appointments/:id/status - Update appointment status
//
// All routes are protected (require JWT token).
// Replaces: IndexedDB operations in src/utils/database.js
// Maps to: AppContext.jsx → appointments state + functions
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All appointment routes require authentication
router.use(authenticate)

// ============================================================
// GET /api/appointments
// ============================================================
// Returns all appointments for the logged-in guide.
// Optional query param: ?status=pending|confirmed|completed
//
// Replaces: loadAllAppointments() from database.js

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query

    let query = 'SELECT * FROM appointments WHERE guide_id = $1'
    const params = [req.user.id]

    // Optionally filter by status
    if (status) {
      query += ' AND status = $2'
      params.push(status)
    }

    query += ' ORDER BY date ASC, time ASC'

    const result = await pool.query(query, params)

    // Transform database column names to match frontend expectations
    // (snake_case → camelCase)
    const appointments = result.rows.map(row => ({
      id: row.id,
      name: row.seeker_name,
      avatar: row.avatar,
      date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      time: row.time.slice(0, 5),                  // Format as HH:MM
      duration: String(row.duration),
      type: row.type,
      notes: row.notes || '',
      status: row.status
    }))

    res.json({ appointments })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/appointments
// ============================================================
// Creates a new appointment for the logged-in guide.
//
// Request body: { name, date, time, duration, type, notes? }
// Replaces: createAppointment() in AppContext.jsx

router.post('/', async (req, res, next) => {
  try {
    const { name, date, time, duration, type, notes } = req.body

    // Validate required fields
    if (!name || !date || !time || !duration || !type) {
      return res.status(400).json({
        error: 'Name, date, time, duration, and type are required.'
      })
    }

    // Validate duration is one of the allowed values
    const validDurations = [30, 60, 90, 120]
    if (!validDurations.includes(Number(duration))) {
      return res.status(400).json({
        error: 'Duration must be 30, 60, 90, or 120 minutes.'
      })
    }

    // Validate type is one of the allowed values
    const validTypes = ['Bible Study', 'Prayer Session', 'Counseling', 'General Guidance']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Type must be one of: ${validTypes.join(', ')}`
      })
    }

    const result = await pool.query(
      `INSERT INTO appointments (guide_id, seeker_name, date, time, duration, type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, name, date, time, Number(duration), type, notes || '']
    )

    const row = result.rows[0]
    const appointment = {
      id: row.id,
      name: row.seeker_name,
      avatar: row.avatar,
      date: row.date.toISOString().split('T')[0],
      time: row.time.slice(0, 5),
      duration: String(row.duration),
      type: row.type,
      notes: row.notes || '',
      status: row.status
    }

    res.status(201).json({ appointment })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PATCH /api/appointments/:id/status
// ============================================================
// Updates an appointment's status.
// Only the guide who owns the appointment can update it.
//
// Request body: { status: "confirmed" | "completed" }
// Replaces: confirmAppointment() and completeAppointment() in AppContext.jsx

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      })
    }

    // Update only if this appointment belongs to the logged-in guide
    const result = await pool.query(
      `UPDATE appointments
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND guide_id = $3
       RETURNING *`,
      [status, id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' })
    }

    const row = result.rows[0]
    const appointment = {
      id: row.id,
      name: row.seeker_name,
      avatar: row.avatar,
      date: row.date.toISOString().split('T')[0],
      time: row.time.slice(0, 5),
      duration: String(row.duration),
      type: row.type,
      notes: row.notes || '',
      status: row.status
    }

    res.json({ appointment })
  } catch (error) {
    next(error)
  }
})

export default router
