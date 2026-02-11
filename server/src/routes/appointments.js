// ============================================================
// Appointment Routes
// ============================================================
// GET    /api/appointments              - List all appointments for the logged-in user (guide or seeker)
// POST   /api/appointments              - Create a new appointment (with optional recurrence)
// PATCH  /api/appointments/:id/status   - Update appointment status
// DELETE /api/appointments/:id          - Cancel a single appointment
// DELETE /api/appointments/series/:sid  - Cancel all future appointments in a series
//
// All routes are protected (require JWT token).

import { Router } from 'express'
import { randomUUID } from 'crypto'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../utils/createNotification.js'

const router = Router()

router.use(authenticate)

// Helper: transform a DB row to a camelCase frontend object
function formatRow(row) {
  return {
    id: row.id,
    name: row.seeker_name,
    avatar: row.avatar,
    date: row.date.toISOString().split('T')[0],
    time: row.time.slice(0, 5),
    duration: String(row.duration),
    type: row.type,
    notes: row.notes || '',
    status: row.status,
    recurrenceRule: row.recurrence_rule || 'none',
    seriesId: row.series_id || null,
    recurrenceEndDate: row.recurrence_end_date
      ? row.recurrence_end_date.toISOString().split('T')[0]
      : null
  }
}

// Helper: generate recurring dates from a start date
function generateRecurringDates(startDate, rule, endDate) {
  const dates = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  // Skip the first occurrence (it's the original)
  while (true) {
    if (rule === 'weekly') current.setDate(current.getDate() + 7)
    else if (rule === 'biweekly') current.setDate(current.getDate() + 14)
    else if (rule === 'monthly') current.setMonth(current.getMonth() + 1)
    else break

    if (current > end) break
    dates.push(current.toISOString().split('T')[0])
  }

  return dates
}

// ============================================================
// GET /api/appointments
// ============================================================
router.get('/', async (req, res, next) => {
  try {
    const { status, from, to } = req.query

    let query = "SELECT * FROM appointments WHERE (guide_id = $1 OR seeker_id = $1) AND status != 'cancelled'"
    const params = [req.user.id]
    let paramCount = 1

    if (status) {
      paramCount++
      query += ` AND status = $${paramCount}`
      params.push(status)
    }

    if (from) {
      paramCount++
      query += ` AND date >= $${paramCount}`
      params.push(from)
    }

    if (to) {
      paramCount++
      query += ` AND date <= $${paramCount}`
      params.push(to)
    }

    query += ' ORDER BY date ASC, time ASC'

    const result = await pool.query(query, params)
    const appointments = result.rows.map(formatRow)

    res.json({ appointments })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/appointments
// ============================================================
// Creates a new appointment. If recurrenceRule is set (weekly/biweekly/monthly),
// generates multiple rows linked by a shared series_id UUID.
//
// Request body: { name, date, time, duration, type, notes?,
//                 recurrenceRule?, recurrenceEndDate? }

router.post('/', async (req, res, next) => {
  try {
    const { name, date, time, duration, type, notes, recurrenceRule, recurrenceEndDate, guideId } = req.body

    if (!name || !date || !time || !duration || !type) {
      return res.status(400).json({
        error: 'Name, date, time, duration, and type are required.'
      })
    }

    // Determine guide_id and seeker_id based on who is creating
    // If guideId is provided, a Seeker is booking with a specific Guide
    const appointmentGuideId = guideId || req.user.id
    const seekerId = guideId ? req.user.id : null

    const validDurations = [30, 60, 90, 120]
    if (!validDurations.includes(Number(duration))) {
      return res.status(400).json({
        error: 'Duration must be 30, 60, 90, or 120 minutes.'
      })
    }

    const validTypes = ['Bible Study', 'Prayer Session', 'Counseling', 'General Guidance']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Type must be one of: ${validTypes.join(', ')}`
      })
    }

    const rule = recurrenceRule || 'none'
    const validRules = ['none', 'weekly', 'biweekly', 'monthly']
    if (!validRules.includes(rule)) {
      return res.status(400).json({ error: 'Invalid recurrence rule.' })
    }

    // If recurring, require an end date
    if (rule !== 'none' && !recurrenceEndDate) {
      return res.status(400).json({ error: 'Recurrence end date is required for recurring appointments.' })
    }

    const seriesId = rule !== 'none' ? randomUUID() : null
    const endDate = rule !== 'none' ? recurrenceEndDate : null

    // Insert the first (original) appointment
    const result = await pool.query(
      `INSERT INTO appointments (guide_id, seeker_id, seeker_name, date, time, duration, type, notes,
                                  recurrence_rule, series_id, recurrence_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [appointmentGuideId, seekerId, name, date, time, Number(duration), type, notes || '',
       rule, seriesId, endDate]
    )

    const appointments = [formatRow(result.rows[0])]

    // Generate recurring instances if applicable
    if (rule !== 'none') {
      const recurringDates = generateRecurringDates(date, rule, endDate)

      for (const rDate of recurringDates) {
        const rResult = await pool.query(
          `INSERT INTO appointments (guide_id, seeker_id, seeker_name, date, time, duration, type, notes,
                                      recurrence_rule, series_id, recurrence_end_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [appointmentGuideId, seekerId, name, rDate, time, Number(duration), type, notes || '',
           rule, seriesId, endDate]
        )
        appointments.push(formatRow(rResult.rows[0]))
      }
    }

    // If a seeker booked with a guide, notify the guide
    if (guideId) {
      const seekerInfo = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id])
      const io = req.app.get('io')
      await createNotification(io, {
        userId: guideId,
        actorId: req.user.id,
        type: 'appointment_request',
        title: `${seekerInfo.rows[0].name} requested a session`,
        body: `${type} on ${date}`,
        referenceType: 'appointment',
        referenceId: appointments[0].id
      })
    }

    res.status(201).json({ appointments })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PATCH /api/appointments/:id/status
// ============================================================
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      })
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND (guide_id = $3 OR seeker_id = $3)
       RETURNING *`,
      [status, id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' })
    }

    res.json({ appointment: formatRow(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/appointments/:id
// ============================================================
// Cancel a single appointment (sets status to 'cancelled')
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND (guide_id = $2 OR seeker_id = $2)
       RETURNING *`,
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' })
    }

    res.json({ appointment: formatRow(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/appointments/series/:seriesId
// ============================================================
// Cancel all future appointments in a recurring series
router.delete('/series/:seriesId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
       WHERE series_id = $1 AND (guide_id = $2 OR seeker_id = $2) AND date >= CURRENT_DATE AND status != 'completed'
       RETURNING *`,
      [req.params.seriesId, req.user.id]
    )

    const appointments = result.rows.map(formatRow)
    res.json({ cancelled: appointments.length, appointments })
  } catch (error) {
    next(error)
  }
})

export default router
