// ============================================================
// Appointment Routes
// ============================================================
// GET    /api/appointments              - List all appointments for the logged-in user (guide or seeker)
// POST   /api/appointments              - Create a new appointment (with optional recurrence)
// PATCH  /api/appointments/:id/status   - Update appointment status (role-aware: only guides confirm/decline)
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
    guideId: row.guide_id,
    seekerId: row.seeker_id,
    seekerName: row.seeker_name,
    guideName: row.guide_name || null,
    avatar: row.avatar,
    seekerPhoto: row.seeker_photo || null,
    guidePhoto: row.guide_photo || null,
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
      : null,
    hasNotes: row.has_notes || false,
    hasReviewed: row.has_reviewed || false
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

// Helper: when a guide confirms/declines, check if a waitlist spot opened
async function checkWaitlistSpot(io, guideId) {
  try {
    const guideResult = await pool.query(
      'SELECT name, accepting_seekers, max_pending_requests FROM users WHERE id = $1',
      [guideId]
    )
    const guide = guideResult.rows[0]
    if (!guide || !guide.accepting_seekers) return

    const pendingResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM appointments
       WHERE guide_id = $1 AND status = 'pending'`,
      [guideId]
    )
    if (pendingResult.rows[0].count >= guide.max_pending_requests) return

    // Pop the oldest waitlisted seeker (atomic update to prevent race conditions)
    const waitlistResult = await pool.query(
      `UPDATE guide_waitlist
       SET notified_at = NOW()
       WHERE id = (
         SELECT id FROM guide_waitlist
         WHERE guide_id = $1 AND notified_at IS NULL
         ORDER BY created_at ASC
         LIMIT 1
       )
       RETURNING seeker_id`,
      [guideId]
    )
    if (waitlistResult.rows.length === 0) return

    const seekerId = waitlistResult.rows[0].seeker_id

    await createNotification(io, {
      userId: seekerId,
      actorId: guideId,
      type: 'waitlist_spot_open',
      title: `A spot opened with ${guide.name}!`,
      body: 'You can now request a session with this guide.',
      referenceType: 'user',
      referenceId: guideId
    })

    // Remove from waitlist after notification
    await pool.query(
      'DELETE FROM guide_waitlist WHERE guide_id = $1 AND seeker_id = $2',
      [guideId, seekerId]
    )
  } catch (error) {
    console.error('Waitlist check failed:', error)
  }
}

// ============================================================
// GET /api/appointments
// ============================================================
// Returns appointments with both guide and seeker names so the
// frontend can display the OTHER person's name on each card.
router.get('/', async (req, res, next) => {
  try {
    const { status, from, to } = req.query

    let query = `
      SELECT a.*, u.name AS guide_name,
             u.photo_url AS guide_photo,
             us.photo_url AS seeker_photo,
             EXISTS(SELECT 1 FROM notes n WHERE n.appointment_id = a.id AND n.user_id = $1) AS has_notes,
             EXISTS(SELECT 1 FROM guide_reviews gr WHERE gr.guide_id = a.guide_id AND gr.seeker_id = $1) AS has_reviewed
      FROM appointments a
      LEFT JOIN users u ON a.guide_id = u.id
      LEFT JOIN users us ON a.seeker_id = us.id
      WHERE (a.guide_id = $1 OR a.seeker_id = $1)
        AND a.status != 'cancelled'`
    const params = [req.user.id]
    let paramCount = 1

    if (status) {
      paramCount++
      query += ` AND a.status = $${paramCount}`
      params.push(status)
    }

    if (from) {
      paramCount++
      query += ` AND a.date >= $${paramCount}`
      params.push(from)
    }

    if (to) {
      paramCount++
      query += ` AND a.date <= $${paramCount}`
      params.push(to)
    }

    query += ' ORDER BY a.date ASC, a.time ASC'

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
// Two flows:
//   1. Seeker creates → sends guideId → status='pending' → guide notified
//   2. Guide creates → sends seekerId → status='confirmed' → seeker notified
//
// Request body: { name, date, time, duration, type, notes?,
//                 recurrenceRule?, recurrenceEndDate?, guideId?, seekerId? }

router.post('/', async (req, res, next) => {
  try {
    const { name, date, time, duration, type, notes, recurrenceRule, recurrenceEndDate, guideId, seekerId } = req.body

    if (!name || !date || !time || !duration || !type) {
      return res.status(400).json({
        error: 'Name, date, time, duration, and type are required.'
      })
    }

    // Determine guide_id, seeker_id, and initial status based on who is creating
    let appointmentGuideId, appointmentSeekerId, initialStatus

    if (guideId) {
      // Seeker is booking with a specific Guide → pending until guide confirms
      // Check guide availability first
      const guideAvail = await pool.query(
        'SELECT accepting_seekers, max_pending_requests FROM users WHERE id = $1',
        [guideId]
      )
      const g = guideAvail.rows[0]
      if (!g) {
        return res.status(404).json({ error: 'Guide not found.' })
      }
      if (!g.accepting_seekers) {
        return res.status(400).json({ error: 'This guide is not currently accepting new seekers.' })
      }
      const pendingResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM appointments
         WHERE guide_id = $1 AND status = 'pending'`,
        [guideId]
      )
      if (pendingResult.rows[0].count >= g.max_pending_requests) {
        return res.status(400).json({
          error: 'This guide has reached their pending request limit. You can join their waitlist instead.'
        })
      }

      appointmentGuideId = guideId
      appointmentSeekerId = req.user.id
      initialStatus = 'pending'
    } else if (seekerId) {
      // Guide is creating appointment with a seeker → auto-confirmed
      appointmentGuideId = req.user.id
      appointmentSeekerId = seekerId
      initialStatus = 'confirmed'
    } else {
      // Fallback: guide creating without a linked seeker
      appointmentGuideId = req.user.id
      appointmentSeekerId = null
      initialStatus = 'pending'
    }

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

    // Look up guide name for the response
    const guideInfo = await pool.query('SELECT name FROM users WHERE id = $1', [appointmentGuideId])
    const guideName = guideInfo.rows[0]?.name || null

    // Insert the first (original) appointment
    const result = await pool.query(
      `INSERT INTO appointments (guide_id, seeker_id, seeker_name, date, time, duration, type, notes,
                                  recurrence_rule, series_id, recurrence_end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [appointmentGuideId, appointmentSeekerId, name, date, time, Number(duration), type, notes || '',
       rule, seriesId, endDate, initialStatus]
    )

    const appointments = [{ ...formatRow(result.rows[0]), guideName }]

    // Generate recurring instances if applicable
    if (rule !== 'none') {
      const recurringDates = generateRecurringDates(date, rule, endDate)

      for (const rDate of recurringDates) {
        const rResult = await pool.query(
          `INSERT INTO appointments (guide_id, seeker_id, seeker_name, date, time, duration, type, notes,
                                      recurrence_rule, series_id, recurrence_end_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [appointmentGuideId, appointmentSeekerId, name, rDate, time, Number(duration), type, notes || '',
           rule, seriesId, endDate, initialStatus]
        )
        appointments.push({ ...formatRow(rResult.rows[0]), guideName })
      }
    }

    const io = req.app.get('io')

    // If a seeker booked with a guide, notify the guide
    if (guideId) {
      const seekerInfo = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id])
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

    // If a guide created appointment with a seeker, notify the seeker
    if (seekerId && !guideId) {
      await createNotification(io, {
        userId: seekerId,
        actorId: req.user.id,
        type: 'appointment_scheduled',
        title: `${guideName} scheduled a session with you`,
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
// Role-aware: only the guide can confirm or decline.
// Conflict detection: prevents double-booking when confirming.
// Sends notifications to the other party on status changes.
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user.id

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'declined']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      })
    }

    // Fetch the appointment to check ownership and current state
    const aptResult = await pool.query(
      `SELECT a.*, u.name AS guide_name
       FROM appointments a
       LEFT JOIN users u ON a.guide_id = u.id
       WHERE a.id = $1 AND (a.guide_id = $2 OR a.seeker_id = $2)`,
      [id, userId]
    )

    if (aptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' })
    }

    const apt = aptResult.rows[0]

    // Only the guide can confirm or decline
    if ((status === 'confirmed' || status === 'declined') && apt.guide_id !== userId) {
      return res.status(403).json({ error: 'Only the guide can confirm or decline appointments.' })
    }

    // Conflict detection when confirming
    if (status === 'confirmed') {
      const [h, m] = apt.time.split(':').map(Number)
      const startMinutes = h * 60 + m
      const endMinutes = startMinutes + apt.duration

      const conflicts = await pool.query(
        `SELECT id, time, duration, seeker_name
         FROM appointments
         WHERE guide_id = $1
           AND date = $2
           AND status = 'confirmed'
           AND id != $3`,
        [apt.guide_id, apt.date.toISOString().split('T')[0], id]
      )

      for (const c of conflicts.rows) {
        const [ch, cm] = c.time.split(':').map(Number)
        const cStart = ch * 60 + cm
        const cEnd = cStart + c.duration
        if (startMinutes < cEnd && endMinutes > cStart) {
          return res.status(409).json({
            error: `Time conflict: you already have a confirmed session with ${c.seeker_name} at that time.`
          })
        }
      }
    }

    // Update the status
    const result = await pool.query(
      `UPDATE appointments
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND (guide_id = $3 OR seeker_id = $3)
       RETURNING *`,
      [status, id, userId]
    )

    const appointment = { ...formatRow(result.rows[0]), guideName: apt.guide_name }

    // Send notifications on status changes
    const io = req.app.get('io')

    if (status === 'confirmed' && apt.seeker_id) {
      await createNotification(io, {
        userId: apt.seeker_id,
        actorId: apt.guide_id,
        type: 'appointment_confirmed',
        title: `${apt.guide_name} confirmed your session`,
        body: `${apt.type} on ${apt.date.toISOString().split('T')[0]}`,
        referenceType: 'appointment',
        referenceId: apt.id
      })
    }

    if (status === 'declined' && apt.seeker_id) {
      await createNotification(io, {
        userId: apt.seeker_id,
        actorId: apt.guide_id,
        type: 'appointment_declined',
        title: `${apt.guide_name} declined your session request`,
        body: `${apt.type} on ${apt.date.toISOString().split('T')[0]}`,
        referenceType: 'appointment',
        referenceId: apt.id
      })
    }

    // When a pending appointment is confirmed or declined, check if a waitlist spot opened
    if (status === 'confirmed' || status === 'declined') {
      await checkWaitlistSpot(io, apt.guide_id)
    }

    res.json({ appointment })
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
